import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/config.dart';
import 'data/offline_cache.dart';
import 'providers/app_providers.dart';
import 'services/local_push.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  final cache = await OfflineCache.open();
  await LocalPushService.init();

  if (!AppConfig.hasSupabaseConfig) {
    runApp(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Set dart-define values:\n'
                'SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL\n\n'
                'See apps/mobile/timely_invoices/README.md',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ),
    );
    return;
  }

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
  );

  runApp(
    ProviderScope(
      overrides: [
        offlineCacheProvider.overrideWithValue(cache),
      ],
      child: const TimelyApp(),
    ),
  );
}
