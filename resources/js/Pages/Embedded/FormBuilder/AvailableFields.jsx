// Step1.jsx

import React from "react";
import { Card, TextField, Text, Checkbox, BlockStack, Layout } from "@shopify/polaris";

// Receive formData and setter as props
export default function Step1({ formData, setFormData }) {

    // A centralized handler to simplify state updates
    const handleChange = (field) => (value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Layout>
            <Layout.Section>
                <Card title="Form Identity" sectioned>
                    <BlockStack gap="400">
                        <TextField
                            label="Form Name"
                            value={formData.name}
                            onChange={handleChange("name")}
                            required
                            placeholder="Enter form name (e.g., Contact Us Form)"
                        />
                        <TextField
                            label="Form Description"
                            value={formData.description}
                            onChange={handleChange("description")}
                            required
                            multiline={3}
                            placeholder="Briefly describe the purpose of this form."
                        />
                        <TextField
                            label="Call to Action (CTA) Text"
                            helpText="The text that appears on the submit button."
                            value={formData.ctaText}
                            onChange={handleChange("ctaText")}
                            required
                            placeholder="Submit, Send Request, Get Started, etc."
                        />
                    </BlockStack>
                </Card>
            </Layout.Section>

            <Layout.Section>
                <Card title="Form Submission & Behavior" sectioned>
                    <BlockStack gap="400">

                        {/* Email checkbox + textfield */}
                        <div>
                            <Checkbox
                                label="Send a notification email on submission"
                                checked={formData.email}
                                onChange={handleChange("email")}
                            />
                            {formData.email && (
                                <div style={{ marginTop: '12px' }}>
                                    <TextField
                                        label="Recipient Email Address"
                                        value={formData.emailValue}
                                        onChange={handleChange("emailValue")}
                                        required
                                        type="email"
                                        placeholder="notifications@example.com"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Redirect URL checkbox + textfield */}
                        <div>
                            <Checkbox
                                label="Redirect user after submission"
                                checked={formData.redirectUrl}
                                onChange={handleChange("redirectUrl")}
                            />
                            {formData.redirectUrl && (
                                <div style={{ marginTop: '12px' }}>
                                    <TextField
                                        label="Redirect URL"
                                        value={formData.redirectUrlValue}
                                        onChange={handleChange("redirectUrlValue")}
                                        required
                                        type="url"
                                        placeholder="https://thankyou.page.com"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Other checkboxes */}
                        <Checkbox
                            label="Enable Client Login (Allow users to save drafts)"
                            checked={formData.clientLogin}
                            onChange={handleChange("clientLogin")}
                        />

                        <Checkbox
                            label="Allow File Uploads across the form"
                            checked={formData.allowFileUpload}
                            onChange={handleChange("allowFileUpload")}
                        />
                    </BlockStack>
                </Card>
            </Layout.Section>
        </Layout>
    );
}