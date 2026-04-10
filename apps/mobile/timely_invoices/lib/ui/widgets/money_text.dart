import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class MoneyText extends StatelessWidget {
  const MoneyText({
    super.key,
    required this.amount,
    this.currency = 'ZAR',
    this.style,
    this.bold = false,
  });

  final double amount;
  final String currency;
  final TextStyle? style;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final sym = currency == 'ZAR' ? 'R' : '$currency ';
    final fmt = NumberFormat.currency(symbol: sym, decimalDigits: 2);
    return Text(
      fmt.format(amount),
      style: (style ?? Theme.of(context).textTheme.bodyLarge)?.copyWith(
            fontWeight: bold ? FontWeight.w700 : null,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
    );
  }
}
