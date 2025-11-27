<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuoteNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $quotationId;
    public $proposalUrl;

    public function __construct($quotationId)
    {
        $this->quotationId = $quotationId;
        // Link to view proposal on your backend
        $this->proposalUrl = url("/proposal/view/{$quotationId}");
    }

    public function build()
    {
        return $this->subject("Your Quotation is Ready")
            ->view('emails.quote-notification');
    }
}
