export const AUTH_MESSAGES = {
  // forgot-password: send reset email
  RESET_RATE_LIMIT:
    "短時間に複数回送信されたため、送信制限がかかっています。しばらく時間をおいてから再試行してください。",
  RESET_SEND_ERROR:
    "再設定メールの送信に失敗しました。入力内容を確認の上、再度お試しください。",

  // reset-password: link/code validation
  LINK_EXPIRED:
    "再設定リンクの有効期限が切れています。再設定メールを再送して、最新のメールから開いてください。",
  LINK_INVALID:
    "再設定リンクが無効です。再設定メールを再送して、最新のメールから開いてください。",
  LINK_RATE_LIMIT:
    "直近で再送済み、または送信上限に達している可能性があります。しばらく時間をおいてから再試行してください。",
  LINK_UNKNOWN_ERROR:
    "再設定リンクの確認に失敗しました。リンクの有効期限切れ、または再送直後の制限の可能性があります。再設定メールを再送して、最新のメールから開いてください。",

  // login: confirmation email resend
  CONFIRM_RESEND_SENT:
    "確認メールを再送しました。受信トレイをご確認ください。",
  CONFIRM_RESEND_RATE_LIMIT:
    "短時間に複数回送信されたため、制限がかかっています。しばらく時間をおいてから再試行してください。",
  CONFIRM_RESEND_ERROR:
    "確認メールの再送に失敗しました。しばらく時間をおいてから再試行してください。",
} as const;
