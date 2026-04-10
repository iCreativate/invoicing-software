import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

const _kBioEnabled = 'timely_biometric_enabled';

/// Optional Face ID / fingerprint gate when returning to the app.
class BiometricAuthService {
  BiometricAuthService({
    LocalAuthentication? localAuth,
    FlutterSecureStorage? storage,
  })  : _local = localAuth ?? LocalAuthentication(),
        _storage = storage ?? const FlutterSecureStorage();

  final LocalAuthentication _local;
  final FlutterSecureStorage _storage;

  Future<bool> get isEnabled async {
    final v = await _storage.read(key: _kBioEnabled);
    return v == '1';
  }

  Future<void> setEnabled(bool on) async {
    await _storage.write(key: _kBioEnabled, value: on ? '1' : '0');
  }

  Future<bool> deviceCanCheck() async {
    try {
      final bio = await _local.canCheckBiometrics;
      final supported = await _local.isDeviceSupported();
      return bio || supported;
    } on PlatformException {
      return false;
    }
  }

  Future<bool> authenticate({String reason = 'Unlock TimelyInvoices'}) async {
    try {
      return _local.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(biometricOnly: true),
      );
    } on PlatformException {
      return false;
    }
  }
}
