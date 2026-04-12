import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/theme.dart';
import 'providers/app_providers.dart';
import 'ui/screens/login_screen.dart';
import 'ui/screens/main_shell.dart';

/// Sign out after this much time without user interaction (foreground or background).
const _kIdleSignOut = Duration(minutes: 5);

class TimelyApp extends ConsumerStatefulWidget {
  const TimelyApp({super.key});

  @override
  ConsumerState<TimelyApp> createState() => _TimelyAppState();
}

class _TimelyAppState extends ConsumerState<TimelyApp> with WidgetsBindingObserver {
  bool _locked = false;
  DateTime _lastActivity = DateTime.now();
  Timer? _idleTimer;
  StreamSubscription<AuthState>? _authSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _authSub = Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (data.session != null &&
          (data.event == AuthChangeEvent.signedIn || data.event == AuthChangeEvent.initialSession)) {
        _lastActivity = DateTime.now();
      }
    });
    _startIdleTimer();
  }

  @override
  void dispose() {
    _idleTimer?.cancel();
    _authSub?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _startIdleTimer() {
    _idleTimer?.cancel();
    _idleTimer = Timer.periodic(const Duration(seconds: 30), (_) => _checkIdleTimeout());
  }

  void _bumpActivity() {
    _lastActivity = DateTime.now();
  }

  Future<void> _checkIdleTimeout() async {
    if (!mounted) return;
    if (Supabase.instance.client.auth.currentSession == null) return;
    if (DateTime.now().difference(_lastActivity) <= _kIdleSignOut) return;
    await _signOutDueToIdle();
  }

  Future<void> _signOutDueToIdle() async {
    _idleTimer?.cancel();
    await Supabase.instance.client.auth.signOut();
    if (mounted) setState(() => _locked = false);
  }

  Future<void> _onResumeFromBackground() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null && DateTime.now().difference(_lastActivity) > _kIdleSignOut) {
      await _signOutDueToIdle();
      return;
    }
    _startIdleTimer();
    await _maybeUnlock();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _maybeArmLock();
    }
    if (state == AppLifecycleState.resumed) {
      _onResumeFromBackground();
    }
  }

  Future<void> _maybeArmLock() async {
    if (Supabase.instance.client.auth.currentSession == null) return;
    final svc = ref.read(biometricServiceProvider);
    if (await svc.isEnabled) {
      setState(() => _locked = true);
    }
  }

  Future<void> _maybeUnlock() async {
    final svc = ref.read(biometricServiceProvider);
    if (!await svc.isEnabled || !_locked) return;
    final ok = await svc.authenticate(reason: 'Unlock TimelyInvoices');
    if (ok && mounted) setState(() => _locked = false);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TimelyInvoices',
      theme: AppTheme.light(),
      home: const _AuthGate(),
      builder: (context, child) {
        final session = Supabase.instance.client.auth.currentSession;
        Widget content = child ?? const SizedBox.shrink();
        if (session != null) {
          content = Listener(
            behavior: HitTestBehavior.translucent,
            onPointerDown: (_) => _bumpActivity(),
            child: content,
          );
        }
        return Stack(
          children: [
            content,
            if (_locked)
              GestureDetector(
                onTap: _maybeUnlock,
                behavior: HitTestBehavior.opaque,
                child: const ColoredBox(
                  color: Color(0xFFF8FAFC),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock_outline, size: 48, color: Color(0xFF16A34A)),
                        SizedBox(height: 16),
                        Text('Locked', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        SizedBox(height: 8),
                        Text('Tap to unlock with biometrics'),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _AuthGate extends ConsumerWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final client = Supabase.instance.client;
    return StreamBuilder<AuthState>(
      stream: client.auth.onAuthStateChange,
      initialData: AuthState(AuthChangeEvent.initialSession, client.auth.currentSession),
      builder: (context, snapshot) {
        final session = snapshot.data?.session ?? client.auth.currentSession;
        if (session == null) return const LoginScreen();
        return const MainShell();
      },
    );
  }
}
