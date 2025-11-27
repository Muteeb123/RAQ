<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\QuoteController;

Route::group(['middleware' => ['verify.embedded', 'verify.shopify']], function () {

    Route::get('/', [DashboardController::class, 'index'])->name('home');
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/search', [DashboardController::class, 'orderSeacrhfilter'])->name('search');
    Route::post('/saveform', [FormController::class, 'store'])->name('form.store');
    Route::get('/forms', [FormController::class, 'index'])->name('form.index');
    Route::get('/formslisting', [FormController::class, 'formspage'])->name('form.page');
    Route::get('/formspage', [FormController::class, 'view'])->name('form.view');
    Route::get('/productspage', [ProductController::class, 'view'])->name('products.view');
    Route::post('/products/assign-form', [ProductController::class, 'assignForm'])->name('products.assignForm');
    Route::post('/formsname', [FormController::class, 'getforms'])->name('forms.getforms');
    Route::get('/quoteslisting', [QuoteController::class, 'index'])->name('quotes.index');
    Route::get('/proposal', [ProposalController::class, 'index'])->name('proposal');
    Route::get('/quotes', [QuoteController::class, 'view'])->name('quotes.view');
    Route::post('/sendproposal', [ProposalController::class, 'create'])->name('sendproposal');
    Route::post('/create/order', [QuoteController::class, 'createOrder'])->name('quotes.createOrder');
    Route::post('/form/update-status/{id}', [FormController::class, 'updateStatus'])->name('form.updateStatus');
    Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index');
    Route::post('/storeintegration', [IntegrationController::class, 'store'])->name('integrations.connect');
    Route::post('/updateintegration', [IntegrationController::class, 'update'])->name('integrations.disconnect');
    Route::post('/deleteintegration', [IntegrationController::class, 'destroy'])->name('integrations.remove');
    Route::post('/form/settings', [FormController::class, 'updateSettings'])->name('form.updateSettings');
});
Route::get('/product/settings/{productID}', [ProductController::class, 'productSettings'])->name('products.settings');
Route::post('/product/form/submit', [ProductController::class, 'productFormSubmit'])->name('products.formSubmit');
Route::get('/products/{id}/{variant_id}', [ProductController::class, 'show'])->name('products.show');
Route::get('/proposal/view/{quotation_id}', [ProposalController::class, 'viewProposal']);
Route::post('/proposal/{action}/{quotation_id}', [ProposalController::class, 'customerReply']);

require __DIR__ . '/auth.php';
