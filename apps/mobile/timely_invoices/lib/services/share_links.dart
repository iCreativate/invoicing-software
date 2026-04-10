import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/config.dart';

class ShareLinks {
  static Future<void> shareText(String text, {String? subject}) {
    return Share.share(text, subject: subject);
  }

  static Future<bool> openWhatsAppWithText(String message) async {
    final encoded = Uri.encodeComponent(message);
    final uri = Uri.parse('https://wa.me/?text=$encoded');
    if (await canLaunchUrl(uri)) {
      return launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return false;
  }

  static String publicInvoiceUrl(String shareId) {
    final base = AppConfig.apiBaseUrl.replaceAll(RegExp(r'/$'), '');
    return '$base/invoice/$shareId';
  }
}
