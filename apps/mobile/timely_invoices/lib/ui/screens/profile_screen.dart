import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config.dart';
import '../../providers/app_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _bioOn = false;
  bool _bioSupported = false;

  bool _bioInit = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_bioInit) return;
    _bioInit = true;
    _initBio();
  }

  Future<void> _initBio() async {
    final svc = ref.read(biometricServiceProvider);
    final on = await svc.isEnabled;
    final can = await svc.deviceCanCheck();
    setState(() {
      _bioOn = on;
      _bioSupported = can;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: const Text('Signed in as'),
            subtitle: Text(user?.email ?? ''),
          ),
          const Divider(),
          ListTile(
            title: const Text('API base'),
            subtitle: Text(AppConfig.apiBaseUrl),
          ),
          if (_bioSupported)
            SwitchListTile(
              title: const Text('Biometric unlock'),
              subtitle: const Text('Require Face ID or fingerprint when opening the app'),
              value: _bioOn,
              onChanged: (v) async {
                final svc = ref.read(biometricServiceProvider);
                if (v) {
                  final ok = await svc.authenticate(reason: 'Enable biometric unlock');
                  if (!ok) return;
                }
                await svc.setEnabled(v);
                setState(() => _bioOn = v);
              },
            ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}
