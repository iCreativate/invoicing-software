import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/offline_cache.dart';
import '../../providers/app_providers.dart';
import '../widgets/money_text.dart';

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  List<Map<String, dynamic>> _payments = [];
  Map<String, dynamic>? _analytics;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = ref.read(timelyApiProvider);
    OfflineCache? cache;
    try {
      cache = ref.read(offlineCacheProvider);
    } catch (_) {}
    try {
      final json = await api.listPayments();
      if (json['success'] == true) {
        final list = (json['payments'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
        setState(() {
          _payments = list;
          _analytics = json['analytics'] as Map<String, dynamic>?;
        });
        await cache?.putJson('payments_list', {'payments': list, 'analytics': json['analytics']});
      }
    } catch (e) {
      final cached = cache?.getJson('payments_list');
      if (cached is Map) {
        setState(() {
          _payments = (cached['payments'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
          _analytics = cached['analytics'] as Map<String, dynamic>?;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _payments.isEmpty) return const Center(child: CircularProgressIndicator());

    final month = _analytics?['month']?.toString() ?? '';
    final monthly = (_analytics?['monthlyIncome'] as num?)?.toDouble() ?? 0;
    final cur = _analytics?['monthlyCurrency']?.toString() ?? 'ZAR';

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
        children: [
          if (_analytics != null)
            Card(
              child: ListTile(
                title: Text('Income $month'),
                subtitle: const Text('Completed payments this month'),
                trailing: MoneyText(amount: monthly, currency: cur, bold: true),
              ),
            ),
          const SizedBox(height: 8),
          Text('Recent payments', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ..._payments.map(
            (p) => Card(
              child: ListTile(
                title: Text(p['client_name']?.toString() ?? 'Payment'),
                subtitle: Text('${p['invoice_number'] ?? ''} · ${p['payment_date'] ?? ''} · ${p['method'] ?? ''}'),
                trailing: MoneyText(
                  amount: (p['amount'] as num?)?.toDouble() ?? 0,
                  currency: p['currency']?.toString() ?? 'ZAR',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
