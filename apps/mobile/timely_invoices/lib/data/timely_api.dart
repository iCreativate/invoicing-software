import 'dart:convert';

import 'package:dio/dio.dart';

import '../core/config.dart';

typedef AccessTokenGetter = Future<String?> Function();

/// HTTP client for Next.js `/api/*` routes. Sends Supabase access token as Bearer for mobile.
class TimelyApi {
  TimelyApi({
    required this.dio,
    required this.getAccessToken,
  });

  final Dio dio;
  final AccessTokenGetter getAccessToken;

  factory TimelyApi.create(AccessTokenGetter getAccessToken) {
    final base = AppConfig.apiBaseUrl.replaceAll(RegExp(r'/$'), '');
    final dio = Dio(
      BaseOptions(
        baseUrl: base,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 60),
        headers: {'Accept': 'application/json'},
      ),
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final t = await getAccessToken();
          if (t != null && t.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $t';
          }
          return handler.next(options);
        },
      ),
    );
    return TimelyApi(dio: dio, getAccessToken: getAccessToken);
  }

  Future<Map<String, dynamic>> getWorkspace() async {
    final res = await dio.get<Map<String, dynamic>>('/api/me/workspace');
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> getDashboardSummary() async {
    final res = await dio.get<Map<String, dynamic>>('/api/dashboard/summary');
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> listInvoices({String? statusCsv}) async {
    final q = statusCsv != null ? '?status=${Uri.encodeQueryComponent(statusCsv)}' : '';
    final res = await dio.get<Map<String, dynamic>>('/api/invoices$q');
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> getInvoice(String id) async {
    final res = await dio.get<Map<String, dynamic>>('/api/invoices/$id');
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> createInvoice(Map<String, dynamic> body) async {
    final res = await dio.post<Map<String, dynamic>>('/api/invoices', data: body);
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> sendInvoice({
    required String invoiceId,
    String? toEmail,
    String? toWhatsapp,
  }) async {
    final res = await dio.post<Map<String, dynamic>>(
      '/api/invoices/send',
      data: {
        'invoiceId': invoiceId,
        if (toEmail != null) 'toEmail': toEmail,
        if (toWhatsapp != null) 'toWhatsapp': toWhatsapp,
      },
    );
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> listPayments({String? month}) async {
    final q = month != null ? '?month=${Uri.encodeQueryComponent(month)}' : '';
    final res = await dio.get<Map<String, dynamic>>('/api/payments$q');
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> recordPayment(Map<String, dynamic> body) async {
    final res = await dio.post<Map<String, dynamic>>('/api/payments', data: body);
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> invoiceGenerate(String input) async {
    final res = await dio.post<Map<String, dynamic>>(
      '/api/ai/invoice-generate',
      data: {'input': input},
    );
    return res.data ?? {};
  }

  /// Streams plain text chunks from `/api/ai/chat` (Vercel AI text stream).
  Stream<String> chatStream(List<Map<String, String>> messages) async* {
    final token = await getAccessToken();
    final res = await dio.post<ResponseBody>(
      '/api/ai/chat',
      data: {'messages': messages},
      options: Options(
        responseType: ResponseType.stream,
        headers: {
          if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
        },
      ),
    );
    final body = res.data;
    if (body == null) return;
    await for (final chunk in body.stream) {
      yield utf8.decode(chunk);
    }
  }
}
