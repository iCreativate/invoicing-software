import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// Build a simple branded PDF from `/api/invoices/[id]` payload for preview + share.
class InvoicePdfService {
  static Future<void> previewAndShare({
    required Map<String, dynamic> invoice,
    required String currency,
  }) async {
    final doc = _buildDocument(invoice, currency);
    await Printing.layoutPdf(onLayout: (format) => doc.save());
  }

  static Future<List<int>> buildBytes({
    required Map<String, dynamic> invoice,
    required String currency,
  }) {
    return _buildDocument(invoice, currency).save();
  }

  static pw.Document _buildDocument(Map<String, dynamic> invoice, String currency) {
    final number = invoice['invoice_number']?.toString() ?? '';
    final client = invoice['client'] as Map<String, dynamic>?;
    final clientName = client?['name']?.toString() ?? 'Client';
    final items = (invoice['items'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
    final total = NumberFormat.currency(symbol: currency == 'ZAR' ? 'R' : '$currency ')
        .format((invoice['total_amount'] as num?)?.toDouble() ?? 0);

    final fmt = DateFormat.yMMMd();

    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Header(
              level: 0,
              child: pw.Text('TimelyInvoices', style: pw.TextStyle(fontSize: 22, color: PdfColors.green800)),
            ),
            pw.SizedBox(height: 12),
            pw.Text('Invoice $number', style: const pw.TextStyle(fontSize: 16)),
            pw.SizedBox(height: 8),
            pw.Text('Bill to: $clientName'),
            if (invoice['issue_date'] != null)
              pw.Text('Issue: ${fmt.format(DateTime.tryParse(invoice['issue_date'].toString()) ?? DateTime.now())}'),
            if (invoice['due_date'] != null)
              pw.Text('Due: ${fmt.format(DateTime.tryParse(invoice['due_date'].toString()) ?? DateTime.now())}'),
            pw.SizedBox(height: 16),
            pw.TableHelper.fromTextArray(
              context: context,
              headers: const ['Description', 'Qty', 'Price', 'Line'],
              data: items.map((it) {
                final desc = it['description']?.toString() ?? '';
                final qty = it['quantity']?.toString() ?? '';
                final up = it['unit_price']?.toString() ?? '';
                final lt = it['line_total']?.toString() ?? '';
                return [desc, qty, up, lt];
              }).toList(),
            ),
            pw.SizedBox(height: 20),
            pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Text('Total: $total', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
    return doc;
  }
}
