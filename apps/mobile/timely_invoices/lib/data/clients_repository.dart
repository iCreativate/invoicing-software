import 'package:supabase_flutter/supabase_flutter.dart';

class ClientListItem {
  ClientListItem({required this.id, required this.name, this.email});

  final String id;
  final String name;
  final String? email;

  factory ClientListItem.fromRow(Map<String, dynamic> row) {
    return ClientListItem(
      id: row['id']?.toString() ?? '',
      name: row['name']?.toString() ?? '',
      email: row['email']?.toString(),
    );
  }
}

class ClientsRepository {
  ClientsRepository(this._client);

  final SupabaseClient _client;

  Future<List<ClientListItem>> listClients() async {
    final res = await _client.from('clients').select('id,name,email').order('name');
    final list = res as List<dynamic>;
    return list.map((e) => ClientListItem.fromRow(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<ClientListItem> createClient({
    required String name,
    String? email,
    String? phone,
    String? address,
  }) async {
    final row = await _client
        .from('clients')
        .insert({
          'name': name,
          'email': email,
          'phone': phone,
          'address': address,
        })
        .select('id,name,email')
        .single();
    return ClientListItem.fromRow(Map<String, dynamic>.from(row));
  }
}
