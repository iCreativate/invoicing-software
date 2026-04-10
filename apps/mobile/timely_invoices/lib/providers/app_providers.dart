import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/clients_repository.dart';
import '../data/offline_cache.dart';
import '../data/timely_api.dart';
import '../services/biometric_auth.dart';

final offlineCacheProvider = Provider<OfflineCache>((ref) {
  throw UnimplementedError('OfflineCache must be overridden');
});

final timelyApiProvider = Provider<TimelyApi>((ref) {
  return TimelyApi.create(() async {
    return Supabase.instance.client.auth.currentSession?.accessToken;
  });
});

final clientsRepositoryProvider = Provider<ClientsRepository>((ref) {
  return ClientsRepository(Supabase.instance.client);
});

final biometricServiceProvider = Provider<BiometricAuthService>((ref) {
  return BiometricAuthService();
});

final connectivityProvider = StreamProvider<List<ConnectivityResult>>((ref) {
  return Connectivity().onConnectivityChanged;
});

class WorkspaceCaps {
  WorkspaceCaps({
    required this.canEdit,
    required this.canRecordPayments,
    required this.canManageTeam,
  });

  final bool canEdit;
  final bool canRecordPayments;
  final bool canManageTeam;

  static WorkspaceCaps empty() =>
      WorkspaceCaps(canEdit: true, canRecordPayments: true, canManageTeam: false);
}

final workspaceCapsProvider = FutureProvider<WorkspaceCaps>((ref) async {
  final api = ref.watch(timelyApiProvider);
  try {
    final json = await api.getWorkspace();
    final data = json['data'] as Map<String, dynamic>?;
    if (data == null) return WorkspaceCaps.empty();
    return WorkspaceCaps(
      canEdit: data['canEdit'] == true,
      canRecordPayments: data['canRecordPayments'] == true,
      canManageTeam: data['canManageTeam'] == true,
    );
  } catch (_) {
    return WorkspaceCaps.empty();
  }
});

final navIndexProvider = StateProvider<int>((ref) => 0);
