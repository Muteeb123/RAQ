<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Test\Constraint\ResponseHeaderLocationSame;

class IntegrationController extends Controller
{
    //

    public function index()
    {
        //
        $integrations = Integration::where('user_id', auth()->user()->id)->get();
        Log::info('Integrations: ' . $integrations->toJson());
        return Inertia::render("Embedded/Integrations", [
            'integrations' => $integrations
        ]);
    }
    public function store(Request $request)
    {
        $request->validate([
            'platform' => 'required|in:slack,discord',
            'apiKey' => 'required|string',
        ]);

        $integration = Integration::create([
            'user_id' => auth()->user()->id,
            'platform' => $request->platform,
            'apiKey' => $request->apiKey,
            'status' => 'connected',
        ]);
        return response()->json([
            'message' => 'Integration connected successfully',
            'integration' => $integration
        ], 201);
    }

    public function update(Request $request)
    {
        $request->validate([
            'status' => 'required|in:connected,disconnected',
        ]);
        $integration = Integration::where('user_id', auth()->user()->id)
            ->where('platform', $request->platform)
            ->firstOrFail();
        $integration->update([
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Integration updated successfully',
            'integration' => $integration
        ], 200);
    }

    public function destroy(Request $request)
    {
        $integration = Integration::where('user_id', auth()->user()->id)
            ->where('platform', $request->platform)
            ->firstOrFail();
        $integration->delete();

        return response()->json([
            'message' => 'Integration deleted successfully'
        ], 200);
    }
}
