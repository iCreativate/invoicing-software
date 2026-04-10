import 'package:flutter/material.dart';

import '../../core/theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});

  final String status;

  Color _color() {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppTheme.primary;
      case 'overdue':
        return Colors.red.shade700;
      case 'sent':
      case 'partial':
        return Colors.blue.shade700;
      case 'draft':
        return Colors.grey.shade700;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey.shade600;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color().withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: _color(),
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
