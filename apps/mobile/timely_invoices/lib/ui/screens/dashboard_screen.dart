import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/offline_cache.dart';
import '../../providers/app_providers.dart';
import '../../services/share_links.dart';
import '../widgets/money_text.dart';
import 'create_invoice_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  Map<String, dynamic>? _summary;
  String? _error;
  bool _loading = true;
  bool _fromCache = false;

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
    } catch (_) {
      cache = null;
    }

    try {
      final json = await api.getDashboardSummary();
      if (json['success'] == true && json['data'] != null) {
        final data = Map<String, dynamic>.from(json['data'] as Map);
        setState(() {
          _summary = data;
          _fromCache = false;
        });
        await cache?.putJson('dashboard_summary', data);
      } else {
        throw Exception(json['error'] ?? 'Failed to load');
      }
    } catch (e) {
      final cached = cache?.getJson('dashboard_summary');
      if (cached is Map) {
        setState(() {
          _summary = Map<String, dynamic>.from(cached);
          _fromCache = true;
          _error = 'Offline: showing saved data. ($e)';
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
    final conn = ref.watch(connectivityProvider);

    final offline = conn.maybeWhen(
      data: (r) => r.contains(ConnectivityResult.none) || r.isEmpty,
      orElse: () => false,
    );

    if (_loading && _summary == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _summary == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final data = _summary!;
    final currency = data['currency']?.toString() ?? 'ZAR';
    final overview = Map<String, dynamic>.from(data['overview'] as Map? ?? {});
    final recent = (data['recentInvoices'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          if (offline || _fromCache)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: Colors.amber.shade100,
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(Icons.cloud_off, color: Colors.amber.shade900),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          offline ? 'You are offline. Changes will sync when you reconnect.' : 'Showing cached dashboard.',
                          style: TextStyle(color: Colors.amber.shade900, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          Text('Revenue & cash', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Paid this month',
                  child: MoneyText(
                    amount: (overview['paidThisMonth'] as num?)?.toDouble() ?? 0,
                    currency: currency,
                    bold: true,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Invoiced',
                  child: MoneyText(
                    amount: (overview['invoicedThisMonth'] as num?)?.toDouble() ?? 0,
                    currency: currency,
                    bold: true,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Outstanding',
                  subtitle: '${overview['outstandingInvoiceCount'] ?? 0} invoices',
                  child: MoneyText(
                    amount: (overview['outstandingAmount'] as num?)?.toDouble() ?? 0,
                    currency: currency,
                    bold: true,
                    style: TextStyle(color: Colors.orange.shade800),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Overdue',
                  subtitle: '${overview['overdueInvoiceCount'] ?? 0} invoices',
                  child: MoneyText(
                    amount: (overview['overdueAmount'] as num?)?.toDouble() ?? 0,
                    currency: currency,
                    bold: true,
                    style: TextStyle(color: Colors.red.shade800),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Quick actions', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          caps.when(
            data: (c) {
              if (!c.canEdit) {
                return Text('Your role is read-only.', style: TextStyle(color: Colors.grey.shade600));
              }
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton.tonalIcon(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => const CreateInvoiceScreen()),
                    ),
                    icon: const Icon(Icons.add),
                    label: const Text('Create invoice'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => ref.read(navIndexProvider.notifier).state = 1,
                    icon: const Icon(Icons.send_outlined),
                    label: const Text('Invoices'),
                  ),
                ],
              );
            },
            loading: () => const SizedBox(height: 40),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 24),
          Text('Recent invoices', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          if (recent.isEmpty)
            Text('No invoices yet.', style: TextStyle(color: Colors.grey.shade600))
          else
            ...recent.take(5).map((inv) {
              final id = inv['id']?.toString() ?? '';
              final invLabel = inv['invoice_number']?.toString() ?? id;
              final bal = (inv['balance_amount'] as num?)?.toDouble() ?? 0;
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(invLabel, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(inv['client_name']?.toString() ?? ''),
                  trailing: MoneyText(amount: bal, currency: inv['currency']?.toString() ?? currency),
                  onTap: () => ShareLinks.shareText('Invoice $invLabel — balance ${inv['currency']} $bal'),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.child, this.subtitle});

  final String label;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
            if (subtitle != null) Text(subtitle!, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}
