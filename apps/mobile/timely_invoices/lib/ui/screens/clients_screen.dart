import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/clients_repository.dart';
import '../../data/offline_cache.dart';
import '../../providers/app_providers.dart';

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  List<ClientListItem> _clients = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final repo = ref.read(clientsRepositoryProvider);
    OfflineCache? cache;
    try {
      cache = ref.read(offlineCacheProvider);
    } catch (_) {}
    try {
      final list = await repo.listClients();
      setState(() => _clients = list);
      final encoded = list.map((c) => {'id': c.id, 'name': c.name, 'email': c.email}).toList();
      await cache?.putJson('clients_list', encoded);
    } catch (e) {
      final cached = cache?.getJson('clients_list');
      if (cached is List) {
        final out = <ClientListItem>[];
        for (final row in cached) {
          final m = Map<String, dynamic>.from(row as Map);
          out.add(ClientListItem(id: m['id'].toString(), name: m['name'].toString(), email: m['email']?.toString()));
        }
        setState(() => _clients = out);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _add() async {
    final nameCtl = TextEditingController();
    final emailCtl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New client'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Name')),
            TextField(controller: emailCtl, decoration: const InputDecoration(labelText: 'Email')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final repo = ref.read(clientsRepositoryProvider);
    try {
      await repo.createClient(
        name: nameCtl.text.trim(),
        email: emailCtl.text.trim().isEmpty ? null : emailCtl.text.trim(),
      );
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final caps = ref.watch(workspaceCapsProvider);
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
          itemCount: _clients.length,
          separatorBuilder: (_, __) => const SizedBox(height: 4),
          itemBuilder: (_, i) {
            final c = _clients[i];
            return Card(
              child: ListTile(
                title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: c.email != null ? Text(c.email!) : null,
              ),
            );
          },
        ),
      ),
      floatingActionButton: caps.maybeWhen(
        data: (x) => x.canEdit ? FloatingActionButton(onPressed: _add, child: const Icon(Icons.person_add_alt_1)) : null,
        orElse: () => null,
      ),
    );
  }
}
