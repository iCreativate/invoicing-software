import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

const _boxName = 'timely_cache';

class OfflineCache {
  OfflineCache(this._box);

  final Box<String> _box;

  static Future<OfflineCache> open() async {
    final box = await Hive.openBox<String>(_boxName);
    return OfflineCache(box);
  }

  String? get(String key) => _box.get(key);

  Future<void> put(String key, String value) => _box.put(key, value);

  Future<void> putJson(String key, Object? jsonEncodable) =>
      put(key, jsonEncode(jsonEncodable));

  dynamic getJson(String key) {
    final raw = get(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }
}

class OfflineSyncQueue {
  OfflineSyncQueue(this._box);

  final Box<String> _box;
  static const String queueKey = 'sync_queue_v1';

  List<Map<String, dynamic>> readAll() {
    final raw = _box.get(queueKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> enqueue(Map<String, dynamic> op) async {
    final q = readAll()..add(op);
    await _box.put(queueKey, jsonEncode(q));
  }

  Future<void> replaceAll(List<Map<String, dynamic>> ops) async {
    await _box.put(queueKey, jsonEncode(ops));
  }
}
