import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/clients_repository.dart';
import '../../providers/app_providers.dart';
import 'invoice_detail_screen.dart';

class LineRow {
  LineRow({this.description = '', this.quantity = 1, this.unitPrice = 0, this.taxRate = 15});

  String description;
  double quantity;
  double unitPrice;
  double taxRate;
}

class CreateInvoiceScreen extends ConsumerStatefulWidget {
  const CreateInvoiceScreen({super.key});

  @override
  ConsumerState<CreateInvoiceScreen> createState() => _CreateInvoiceScreenState();
}

class _CreateInvoiceScreenState extends ConsumerState<CreateInvoiceScreen> {
  ClientListItem? _client;
  final List<LineRow> _lines = [LineRow()];
  DateTime _issue = DateTime.now();
  DateTime _due = DateTime.now().add(const Duration(days: 14));
  bool _saving = false;

  Future<void> _pickClient() async {
    final repo = ref.read(clientsRepositoryProvider);
    final list = await repo.listClients();
    if (!mounted) return;
    final picked = await showModalBottomSheet<ClientListItem>(
      context: context,
      builder: (ctx) {
        return ListView(
          children: [
            for (final c in list)
              ListTile(
                title: Text(c.name),
                subtitle: c.email != null ? Text(c.email!) : null,
                onTap: () => Navigator.pop(ctx, c),
              ),
          ],
        );
      },
    );
    if (picked != null) setState(() => _client = picked);
  }

  Future<void> _save() async {
    final c = _client;
    if (c == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Choose a client')));
      return;
    }
    final items = <Map<String, dynamic>>[];
    for (final l in _lines) {
      if (l.description.trim().isEmpty) continue;
      items.add({
        'description': l.description.trim(),
        'quantity': l.quantity,
        'unit_price': l.unitPrice,
        'tax_rate': l.taxRate,
      });
    }
    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one line')));
      return;
    }

    setState(() => _saving = true);
    try {
      final api = ref.read(timelyApiProvider);
      final body = <String, dynamic>{
        'client_id': c.id,
        'issue_date': _issue.toIso8601String().split('T').first,
        'due_date': _due.toIso8601String().split('T').first,
        'currency': 'ZAR',
        'items': items,
      };
      final res = await api.createInvoice(body);
      if (res['success'] == true) {
        final data = res['data'] as Map<String, dynamic>?;
        final id = data?['id']?.toString();
        if (id != null && mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => InvoiceDetailScreen(invoiceId: id)),
          );
          return;
        }
      }
      throw Exception(res['error'] ?? 'Create failed');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New invoice')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: Text(_client?.name ?? 'Select client'),
            subtitle: _client?.email != null ? Text(_client!.email!) : null,
            trailing: const Icon(Icons.chevron_right),
            onTap: _pickClient,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ListTile(
                  title: const Text('Issue'),
                  subtitle: Text(_issue.toIso8601String().split('T').first),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: context,
                      initialDate: _issue,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                    );
                    if (d != null) setState(() => _issue = d);
                  },
                ),
              ),
              Expanded(
                child: ListTile(
                  title: const Text('Due'),
                  subtitle: Text(_due.toIso8601String().split('T').first),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: context,
                      initialDate: _due,
                      firstDate: _issue,
                      lastDate: DateTime(2100),
                    );
                    if (d != null) setState(() => _due = d);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Line items', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          for (var i = 0; i < _lines.length; i++)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextField(
                      decoration: const InputDecoration(labelText: 'Description'),
                      onChanged: (v) => _lines[i].description = v,
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(labelText: 'Qty'),
                            keyboardType: TextInputType.number,
                            onChanged: (v) => _lines[i].quantity = double.tryParse(v) ?? 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(labelText: 'Unit price'),
                            keyboardType: TextInputType.number,
                            onChanged: (v) => _lines[i].unitPrice = double.tryParse(v) ?? 0,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          TextButton.icon(
            onPressed: () => setState(() => _lines.add(LineRow())),
            icon: const Icon(Icons.add),
            label: const Text('Add line'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save draft'),
          ),
        ],
      ),
    );
  }
}
