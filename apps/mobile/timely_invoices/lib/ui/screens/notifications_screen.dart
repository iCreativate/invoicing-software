import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/app_providers.dart';
import '../../services/local_push.dart';
import '../widgets/money_text.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<Map<String, dynamic>> _activity = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(timelyApiProvider);
      final json = await api.getDashboardSummary();
      if (json['success'] == true) {
        final data = json['data'] as Map<String, dynamic>?;
        final act = (data?['activity'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
        setState(() => _activity = act);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _title(Map<String, dynamic> a) {
    switch (a['type']) {
      case 'payment_received':
        return 'Payment received';
      case 'invoice_sent':
        return 'Invoice sent';
      case 'reminder_sent':
        return 'Reminder sent';
      default:
        return 'Activity';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
      children: [
        Text(
          'Payment received and overdue alerts also appear here from your latest sync. '
          'Enable system notifications in Profile to preview local alerts.',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
        ),
        const SizedBox(height: 12),
        FilledButton.tonal(
          onPressed: () {
            LocalPushService.showPaymentReceived(title: 'Payment received', body: 'Demo: R 1,200 from Acme');
            LocalPushService.showOverdueReminder(title: 'Invoice overdue', body: 'INV-2026-0001 is past due');
          },
          child: const Text('Test local notifications'),
        ),
        const SizedBox(height: 24),
        Text('Recent activity', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (_activity.isEmpty)
          const Text('No recent activity.')
        else
          ..._activity.map((a) {
            final subtitle = StringBuffer()
              ..write(a['clientName'] ?? '')
              ..write(' · ')
              ..write(a['invoiceNumber'] ?? '');
            Widget? trailing;
            if (a['type'] == 'payment_received' && a['amount'] != null) {
              trailing = MoneyText(
                amount: (a['amount'] as num).toDouble(),
                currency: a['currency']?.toString() ?? 'ZAR',
              );
            }
            return Card(
              child: ListTile(
                title: Text(_title(a)),
                subtitle: Text(subtitle.toString()),
                trailing: trailing,
              ),
            );
          }),
      ],
    );
  }
}
