<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Form;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FormController extends Controller
{
    /**
     * Store form data from frontend
     */

    public function updateStatus(Request $request, $id)
    {
        Log::info("Updating form status", ['id' => $id, 'status' => $request->input('status')]);

        // Validate the incoming status
        $request->validate([
            'status' => 'required|in:active,inactive,draft',
        ]);

        // Find the form by ID
        $form = Form::find($id);

        if (!$form) {
            Log::warning("Form not found for status update", ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Form not found.'
            ], 404);
        }

        // Update the status
        $form->status = $request->input('status');
        $form->save();

        Log::info("Form status updated successfully", ['id' => $id, 'new_status' => $form->status]);

        return response()->json([
            'success' => true,
            'message' => 'Form status updated successfully.'
        ]);
    }
    public function store(Request $request)
    {
        // Validate basic required fields from setup
        $request->validate([
            'setup.name' => 'required|string|max:255',
            'setup.ctaText' => 'nullable|string|max:255',
            'fields' => 'required|array',
        ]);

        // Prepare data for saving
        $formData = [
            'name' => $request->input('setup.name'),
            'description' => $request->input('setup.description'),
            'cta_text' => $request->input('setup.ctaText'),
            'redirect_url' => $request->input('setup.redirectUrlValue'),

            'email_required' => $request->input('setup.email', false),
            'redirect_enabled' => $request->input('setup.redirectUrl', false),
            'client_login' => $request->input('setup.clientLogin', false),
            'allow_file_upload' => $request->input('setup.allowFileUpload', false),
            'email_value' => $request->input('setup.emailValue'),

            'fields' => $request->input('fields'),
        ];

        // Save form
        $form = Form::create($formData);

        return response()->json([
            'success' => true,
            'form_id' => $form->id,
            'message' => 'Form saved successfully.'
        ]);
    }

    public function show(int $id)
    {
        // Find the form by its ID or fail (throw a 404 error)
        $form = Form::findOrFail($id);

        // Return the single form object as JSON
        return response()->json([
            'success' => true,
            'form' => $form,
        ]);

        // NOTE: For an Inertia.js application, you would return:
        // return Inertia::render('Forms/Show', ['form' => $form]);
    }
    public function formspage()
    {

        return Inertia::render('Embedded/FormListing');
    }
    public function view()
    {
        Log::info("Hello from FormController view method");
        return Inertia::render('Embedded/FormBuilder/FormBuilder');
    }

    public function getforms(Request $request)
    {
        Log::info("Fetching forms with search");
        $search = $request->input('search', '');
        $limit = $request->input('limit', 5);

        // Query forms with optional search
        $query = Form::select('id as form_id', 'name as form_name');

        if (!empty($search)) {
            $query->where('name', 'like', "%{$search}%");
        }

        $forms = $query->limit($limit)->get();

        return response()->json($forms);
    }
    public function index(Request $request)
    {
        $perPage = (int) $request->query('limit', 5);
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = Form::query();

        // Status filter
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Search by form name
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $paginated = $query->latest()->paginate($perPage);

        // Map to ensure frontend always receives boolean values for required fields


        return response()->json([
            'data' => $paginated->items(),
            'total' => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
        ]);
    }

    public function updateSettings(Request $request)
    {
        //
        Log::info("Hello from FormController updateSettings method");
        Log::info('Request Data: ' . json_encode($request->all()));
        $formId = $request->input('id');
        $form = Form::find($formId);
        if (!$form) {
            Log::warning("Form not found for settings update", ['form_id' => $formId]);
            return response()->json([
                'success' => false,
                'message' => 'Form not found.'
            ], 404);
        }
        $clientLogin = $request->input('client_login', false);
        $emailRequired = $request->input('email_required', false);
        $allowFileUpload = $request->input('allow_file_upload', false);
        $redirectEnabled = $request->input('redirect_enabled', false);
        $form->client_login = $clientLogin;
        $form->email_required = $emailRequired;
        $form->allow_file_upload = $allowFileUpload;
        $form->redirect_enabled = $redirectEnabled;
        $form->redirect_url = $request->input('redirect_url', $form->redirect_url);
        $form->email_value = $request->input('email', $form->email_value);
        $form->save();
        Log::info("Form settings updated successfully", ['form_id' => $formId]);
        return response()->json([
            'success' => true,
            'message' => 'Form settings updated successfully.'
        ]);
    }
}
