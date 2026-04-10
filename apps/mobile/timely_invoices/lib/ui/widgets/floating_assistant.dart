import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/app_providers.dart';

class ChatMessage {
  ChatMessage({required this.role, required this.content});

  final String role;
  final String content;
}

class AssistantNotifier extends Notifier<List<ChatMessage>> {
  bool sending = false;

  @override
  List<ChatMessage> build() => [
        ChatMessage(
          role: 'assistant',
          content: 'Hi, I am Ask Timely. Try:\n'
              'Who owes me money?\n'
              'Show overdue invoices\n'
              'Create invoice for John R5000',
        ),
      ];

  Future<void> sendUserText(String text) async {
    final t = text.trim();
    if (t.isEmpty || sending) return;
    sending = true;
    final api = ref.read(timelyApiProvider);
    state = [...state, ChatMessage(role: 'user', content: t)];

    final dataLines = <String>[];
    final lower = t.toLowerCase();

    try {
      if (lower.contains('overdue')) {
        final inv = await api.listInvoices(statusCsv: 'overdue');
        if (inv['success'] == true) {
          final data = inv['data'] as Map<String, dynamic>?;
          final list = (data?['invoices'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
          if (list.isEmpty) {
            dataLines.add('No overdue invoices right now.');
          } else {
            dataLines.add('Overdue invoices (${list.length}):');
            for (final r in list.take(12)) {
              final num = r['invoice_number'] ?? r['id'];
              final client = r['client_name'] ?? '';
              final bal = r['balance_amount'];
              dataLines.add('- $num · $client · balance $bal');
            }
          }
        }
      } else if (lower.contains('owe') || lower.contains('outstanding') || lower.contains('who owes')) {
        final dash = await api.getDashboardSummary();
        if (dash['success'] == true) {
          final d = dash['data'] as Map<String, dynamic>?;
          final o = d?['overview'] as Map<String, dynamic>?;
          if (o != null) {
            dataLines.add(
              'Outstanding: ${o['outstandingAmount']} across ${o['outstandingInvoiceCount']} invoices. '
              'Overdue: ${o['overdueAmount']} (${o['overdueInvoiceCount']} invoices).',
            );
          }
        }
      }

      if (RegExp(r'create invoice|new invoice', caseSensitive: false).hasMatch(t)) {
        final gen = await api.invoiceGenerate(t);
        if (gen['success'] == true && gen['data'] != null) {
          dataLines.add('Draft from AI (review on web before sending):\n${gen['data']}');
        } else {
          dataLines.add('Could not generate draft: ${gen['error'] ?? 'unknown'}');
        }
      }
    } catch (e) {
      dataLines.add('Live data error: $e');
    }

    if (dataLines.isNotEmpty) {
      state = [...state, ChatMessage(role: 'assistant', content: dataLines.join('\n'))];
    }

    final forModel = <Map<String, String>>[];
    for (final m in state) {
      if (m.content.trim().isEmpty) continue;
      forModel.add({'role': m.role, 'content': m.content});
    }

    try {
      var acc = '';
      state = [...state, ChatMessage(role: 'assistant', content: '')];
      await for (final chunk in api.chatStream(forModel)) {
        acc += chunk;
        final copy = [...state];
        copy[copy.length - 1] = ChatMessage(role: 'assistant', content: acc);
        state = copy;
      }
      if (acc.trim().isEmpty) {
        final copy = [...state];
        copy[copy.length - 1] = ChatMessage(
          role: 'assistant',
          content: dataLines.isNotEmpty
              ? 'Used your workspace data above. (AI stream empty — check ANTHROPIC_API_KEY on the server.)'
              : 'AI is not responding. Check server configuration.',
        );
        state = copy;
      }
    } catch (e) {
      state = [...state, ChatMessage(role: 'assistant', content: 'Chat error: $e')];
    } finally {
      sending = false;
    }
  }
}

final assistantMessagesProvider = NotifierProvider<AssistantNotifier, List<ChatMessage>>(AssistantNotifier.new);

class FloatingAssistant extends ConsumerStatefulWidget {
  const FloatingAssistant({super.key});

  @override
  ConsumerState<FloatingAssistant> createState() => _FloatingAssistantState();
}

class _FloatingAssistantState extends ConsumerState<FloatingAssistant> {
  final TextEditingController _ctl = TextEditingController();
  final ScrollController _scroll = ScrollController();
  bool _open = false;

  @override
  void dispose() {
    _ctl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(assistantMessagesProvider);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        if (_open)
          Positioned.fill(
            child: GestureDetector(
              onTap: () => setState(() => _open = false),
              child: Container(color: Colors.black26),
            ),
          ),
        if (_open)
          Positioned(
            left: 16,
            right: 16,
            bottom: 100,
            child: Material(
              elevation: 12,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                constraints: const BoxConstraints(maxHeight: 420),
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Text('Ask Timely', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        const Spacer(),
                        IconButton(onPressed: () => setState(() => _open = false), icon: const Icon(Icons.close)),
                      ],
                    ),
                    Flexible(
                      child: ListView.builder(
                        controller: _scroll,
                        shrinkWrap: true,
                        itemCount: messages.length,
                        itemBuilder: (_, i) {
                          final m = messages[i];
                          final isUser = m.role == 'user';
                          return Align(
                            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: isUser ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                m.content.isEmpty ? '…' : m.content,
                                style: TextStyle(
                                  color: isUser ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurface,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _ctl,
                            decoration: const InputDecoration(hintText: 'Ask anything…', isDense: true),
                            onSubmitted: (_) => _submit(),
                          ),
                        ),
                        IconButton.filled(
                          onPressed: ref.read(assistantMessagesProvider.notifier).sending ? null : _submit,
                          icon: const Icon(Icons.send, size: 20),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        Positioned(
          right: 16,
          bottom: 88,
          child: FloatingActionButton.extended(
            onPressed: () {
              setState(() => _open = !_open);
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (_scroll.hasClients) {
                  _scroll.jumpTo(_scroll.position.maxScrollExtent);
                }
              });
            },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Ask Timely'),
          ),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    final notifier = ref.read(assistantMessagesProvider.notifier);
    final t = _ctl.text;
    _ctl.clear();
    await notifier.sendUserText(t);
    if (_scroll.hasClients) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
      _scroll.jumpTo(_scroll.position.maxScrollExtent);
    }
  }
}
