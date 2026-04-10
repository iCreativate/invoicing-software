import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/theme.dart';
import 'providers/app_providers.dart';
import 'ui/screens/login_screen.dart';
import 'ui/screens/main_shell.dart';

class TimelyApp extends ConsumerStatefulWidget {
  const TimelyApp({super.key});

  @override
  ConsumerState<TimelyApp> createState() => _TimelyAppState();
}

class _TimelyAppState extends ConsumerState<TimelyApp> with WidgetsBindingObserver {
  bool _locked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _maybeArmLock();
    }
    if (state == AppLifecycleState.resumed) {
      _maybeUnlock();
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
        return Stack(
          children: [
            if (child != null) child,
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
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session == null) return const LoginScreen();
        return const MainShell();
      },
    );
  }
}
