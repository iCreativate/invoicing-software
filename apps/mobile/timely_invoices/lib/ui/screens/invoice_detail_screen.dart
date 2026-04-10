import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/app_providers.dart';
import '../../services/invoice_pdf.dart';
import '../../services/share_links.dart';
import '../widgets/money_text.dart';
import '../widgets/status_badge.dart';

class InvoiceDetailScreen extends ConsumerStatefulWidget {
  const InvoiceDetailScreen({super.key, required this.invoiceId});

  final String invoiceId;

  @override
  ConsumerState<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends ConsumerState<InvoiceDetailScreen> {
  Map<String, dynamic>? _invoice;
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
    try {
      final api = ref.read(timelyApiProvider);
      final json = await api.getInvoice(widget.invoiceId);
      if (json['success'] == true) {
        final data = json['data'] as Map<String, dynamic>?;
        final inv = data?['invoice'] as Map<String, dynamic>?;
        setState(() => _invoice = inv == null ? null : Map<String, dynamic>.from(inv));
      } else {
        throw Exception(json['error']);
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send({bool email = false, bool whatsapp = false}) async {
    final inv = _invoice;
    if (inv == null) return;
    final client = inv['client'] as Map<String, dynamic>?;
    final api = ref.read(timelyApiProvider);
    try {
      await api.sendInvoice(
        invoiceId: widget.invoiceId,
        toEmail: email ? (client == null ? null : client['email']?.toString()) : null,
        toWhatsapp: whatsapp ? (client == null ? null : client['phone']?.toString()) : null,
      );
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Send request completed.')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_error != null || _invoice == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Invoice')),
        body: Center(child: Text(_error ?? 'Not found')),
      );
    }

    final inv = _invoice!;
    final currency = inv['currency']?.toString() ?? 'ZAR';
    final client = inv['client'] as Map<String, dynamic>?;
    final shareId = inv['public_share_id']?.toString();
    final caps = ref.watch(workspaceCapsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(inv['invoice_number']?.toString() ?? 'Invoice'),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            onPressed: () => InvoicePdfService.previewAndShare(invoice: inv, currency: currency),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'wa') {
                final link = shareId != null ? ShareLinks.publicInvoiceUrl(shareId) : '';
                ShareLinks.openWhatsAppWithText('Invoice ${inv['invoice_number']}: $link');
              }
              if (v == 'share') {
                ShareLinks.shareText('Invoice ${inv['invoice_number']} — ${ShareLinks.publicInvoiceUrl(shareId ?? '')}');
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'wa', child: Text('WhatsApp')),
              PopupMenuItem(value: 'share', child: Text('Share link')),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              StatusBadge(status: inv['status']?.toString() ?? ''),
              const Spacer(),
              MoneyText(
                amount: (inv['total_amount'] as num?)?.toDouble() ?? 0,
                currency: currency,
                bold: true,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Client', style: Theme.of(context).textTheme.labelMedium),
          Text(client?['name']?.toString() ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          if (client?['email'] != null) Text(client!['email']!.toString()),
          if (client?['phone'] != null) Text(client!['phone']!.toString()),
          const SizedBox(height: 24),
          caps.when(
            data: (c) {
              if (!c.canEdit) return const SizedBox.shrink();
              return Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _send(email: true),
                      child: const Text('Send email'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => _send(whatsapp: true),
                      child: const Text('Send WhatsApp'),
                    ),
                  ),
                ],
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}
