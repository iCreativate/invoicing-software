import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/offline_cache.dart';
import '../../providers/app_providers.dart';
import '../widgets/money_text.dart';
import '../widgets/status_badge.dart';
import 'create_invoice_screen.dart';
import 'invoice_detail_screen.dart';

class InvoicesScreen extends ConsumerStatefulWidget {
  const InvoicesScreen({super.key});

  @override
  ConsumerState<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends ConsumerState<InvoicesScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final api = ref.read(timelyApiProvider);
    OfflineCache? cache;
    try {
      cache = ref.read(offlineCacheProvider);
    } catch (_) {}

    try {
      final json = await api.listInvoices();
      if (json['success'] == true) {
        final data = json['data'] as Map<String, dynamic>?;
        final raw = data?['invoices'] as List<dynamic>? ?? [];
        final list = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        setState(() => _rows = list);
        await cache?.putJson('invoices_list', list);
      } else {
        throw Exception(json['error']);
      }
    } catch (e) {
      final cached = cache?.getJson('invoices_list');
      if (cached is List) {
        setState(() {
          _rows = cached.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _error = 'Cached list. $e';
        });
      } else {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final caps = ref.watch(workspaceCapsProvider);

    Widget body;
    if (_loading && _rows.isEmpty) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null && _rows.isEmpty) {
      body = Center(child: Text(_error!));
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
          itemCount: _rows.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, i) {
            final r = _rows[i];
            final id = r['id']?.toString() ?? '';
            final cur = r['currency']?.toString() ?? 'ZAR';
            return Card(
              child: ListTile(
                title: Text(r['invoice_number']?.toString() ?? id, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(r['client_name']?.toString() ?? ''),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    MoneyText(
                      amount: (r['total_amount'] as num?)?.toDouble() ?? 0,
                      currency: cur,
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    StatusBadge(status: r['status']?.toString() ?? 'draft'),
                  ],
                ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => InvoiceDetailScreen(invoiceId: id)),
                ),
              ),
            );
          },
        ),
      );
    }

    final fab = caps.maybeWhen(
      data: (c) => c.canEdit
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const CreateInvoiceScreen()),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Invoice'),
            )
          : null,
      orElse: () => null,
    );

    return Scaffold(body: body, floatingActionButton: fab);
  }
}
