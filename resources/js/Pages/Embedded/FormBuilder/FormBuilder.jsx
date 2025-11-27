// FormBuilder.jsx
import React, { useState, useCallback } from "react";
import { Layout, Page, Card, Button } from "@shopify/polaris";
import Step1 from "./AvailableFields"; // Form Setup
import FormDesigner from "./FormPreview"; // Designer
import { usePage } from "@inertiajs/react";

// Helper function to save data - mock implementation
const saveFormToBackend = async (data, query) => {
    console.log("--- FINAL FORM DATA TO BACKEND ---");
    console.log(JSON.stringify(data, null, 2));

    try {
        const response = await fetch(route("form.store", query), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            return { success: true, message: "Form configuration and fields saved successfully!" };
        } else {
            return { success: false, message: `Failed to save form. Status: ${response.status}` };
        }
    } catch (error) {
        return { success: false, message: `Network error during save: ${error.message}` };
    }
};

// Validation helpers
const validateStep1 = (formSetup) => {
    if (!formSetup.name?.trim()) return { ok: false, message: "Form name is required." };
    if (!formSetup.ctaText?.trim()) return { ok: false, message: "CTA text is required." };
    if (formSetup.email && !formSetup.emailValue?.trim()) return { ok: false, message: "Recipient email is required when email notification is enabled." };
    if (formSetup.redirectUrl && !formSetup.redirectUrlValue?.trim()) return { ok: false, message: "Redirect URL is required when redirect is enabled." };
    // Add any other step1-specific rules here
    return { ok: true };
};

const validateFieldsForSave = (fields) => {
    if (!Array.isArray(fields)) return { ok: false, message: "Form fields missing." };

    const mandatoryIds = ["mandatory_name", "mandatory_email", "mandatory_shipping_address", "mandatory_quantity"];
    // Ensure mandatory fields present
    for (const id of mandatoryIds) {
        if (!fields.some((f) => f.id === id)) {
            return { ok: false, message: "Mandatory system fields are missing." };
        }
    }

    // At least one user field besides mandatory system fields
    const userAdded = fields.filter((f) => !mandatoryIds.includes(f.id));
    if (userAdded.length === 0) {
        return { ok: false, message: "Please add at least one user field to the form." };
    }

    // Validate each field
    for (const f of fields) {
        if (!f.label || !String(f.label).trim()) {
            return { ok: false, message: `Field label is required for field type: ${f.type || "unknown"}.` };
        }

        if (["Dropdown", "Yes or No"].includes(f.type)) {
            if (!Array.isArray(f.options) || f.options.filter(Boolean).length === 0) {
                return { ok: false, message: `Field "${f.label}" must have at least one option.` };
            }
            // ensure no empty options
            const empties = f.options.filter((opt) => !String(opt).trim());
            if (empties.length > 0) {
                return { ok: false, message: `Field "${f.label}" contains an empty option. Remove or fix it.` };
            }
        }
    }

    return { ok: true };
};

export default function FormBuilder() {
    const [activeStep, setActiveStep] = useState(1);
    const { props } = usePage();
    const query = props?.ziggy?.query;

    // Step 1: Form Setup (Name, CTA, Email config, etc.)
    const [formSetup, setFormSetup] = useState({
        name: "",
        description: "",
        ctaText: "",
        email: false,
        redirectUrl: false,
        clientLogin: false,
        allowFileUpload: false,
        emailValue: "",
        redirectUrlValue: "",
    });

    // Step 2: Form Fields
    // Designer will initialize mandatory fields only once if fields is empty
    const [fields, setFields] = useState([]);

    const steps = [
        { id: 1, label: "STEP 01", title: "FORM SETUP" },
        { id: 2, label: "STEP 02", title: "FORM DESIGNER" },
    ];

    // --- Action Handlers ---

    const handleNext = useCallback(() => {
        if (activeStep === 1) {
            const v = validateStep1(formSetup);
            if (!v.ok) {
                alert(v.message);
                return;
            }
        }
        setActiveStep((prev) => Math.min(prev + 1, steps.length));
    }, [activeStep, formSetup]);

    const handleBack = useCallback(() => {
        setActiveStep((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleSubmit = async () => {
        // Validate step 1 again before final save
        const v1 = validateStep1(formSetup);
        if (!v1.ok) {
            alert(v1.message);
            setActiveStep(1);
            return;
        }

        // Validate fields thoroughly
        const vf = validateFieldsForSave(fields);
        if (!vf.ok) {
            alert(vf.message);
            setActiveStep(2);
            return;
        }

        const finalFormData = {
            setup: formSetup,
            fields,
        };

        const result = await saveFormToBackend(finalFormData, query);

        if (result.success) {
            alert(result.message);
            // Optionally clear or redirect
        } else {
            alert(`Error: ${result.message}`);
        }
    };

    // Render
    const isLastStep = activeStep === steps.length;

    let activeComponent;
    if (activeStep === 1) {
        activeComponent = <Step1 formData={formSetup} setFormData={setFormSetup} />;
    } else if (activeStep === 2) {
        activeComponent = <FormDesigner fields={fields} setFields={setFields} />;
    }

    return (
        <Page
            title="Form Builder"
            backAction={{ content: "Back to Forms", onAction: () => window.history.back() }}
            primaryAction={isLastStep ? { content: "Save Form", primary: true, onAction: handleSubmit } : undefined}
            secondaryActions={
                !isLastStep
                    ? [{ content: "Next Step", onAction: handleNext, primary: true }]
                    : [{ content: "Back to Setup", onAction: handleBack }]
            }
        >
            <Layout>
                <Layout.Section>
                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: "20px", padding: "20px 0" }}>
                        {steps.map((step) => (
                            <div
                                key={step.id}

                                style={{
                                    position: "relative",

                                    padding: "10px",
                                    borderRadius: "6px",
                                    backgroundColor: activeStep === step.id ? "#29845a" : "white",
                                    color: activeStep === step.id ? "white" : "inherit",
                                    transition: "background-color 0.2s",
                                    minWidth: "150px",
                                    border: activeStep !== step.id ? "1px solid #e6e8eb" : "none",
                                }}
                            >
                                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{step.label}</div>
                                <div style={{ fontSize: "16px", fontWeight: "bold" }}>{step.title}</div>
                            </div>
                        ))}
                    </div>
                </Layout.Section>

                <Layout.Section>{activeComponent}</Layout.Section>
            </Layout>
        </Page>
    );
}
