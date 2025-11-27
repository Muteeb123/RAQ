import {
    Box,
    Button,
    Card,
    IndexFilters,
    IndexTable,
    InlineStack,
    Page,
    Text,
    useBreakpoints,
    useSetIndexFiltersMode,
    Badge,
    Pagination,
    Select,
    Modal,
    Checkbox as CheckBox,
    BlockStack,
    TextField,
} from '@shopify/polaris';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}

const StatusIcon = ({ isTrue }) => (
    isTrue ? <Badge tone="success">✓</Badge> : <Badge tone="critical">✗</Badge>
);

export default function FormsTable() {
    const [forms, setForms] = useState([]);
    const [queryValue, setQueryValue] = useState('');
    const debouncedQuery = useDebounce(queryValue, 500);
    const [selectedTab, setSelectedTab] = useState(0);
    const { props } = usePage();
    const query = props?.ziggy?.query;

    const [page, setPage] = useState(1);
    const [perPage] = useState(5);
    const [total, setTotal] = useState(0);

    const { mode, setMode } = useSetIndexFiltersMode();
    const breakpoints = useBreakpoints();

    const tabs = useMemo(() => ([
        { id: "all", content: "All" },
        { id: "active", content: "Active" },
        { id: "draft", content: "Draft" },
    ]), []);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalForm, setModalForm] = useState(null);
    const [modalEmail, setModalEmail] = useState('');
    const [modalRedirectUrl, setModalRedirectUrl] = useState('');
    const [emailError, setEmailError] = useState('');
    const [redirectError, setRedirectError] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleTabChange = useCallback((index) => {
        setSelectedTab(index);
        setPage(1);
    }, []);

    const handleManageSettings = useCallback((form) => {
        setModalForm(form);
        setModalEmail(form.email_value || '');
        setModalRedirectUrl(form.redirect_url || '');
        setEmailError('');
        setRedirectError('');
        setModalOpen(true);
    }, []);

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleModalUpdate = async () => {
        if (!modalForm) return;

        // Validation
        if (modalForm.email_required && !isValidEmail(modalEmail)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        if (modalForm.redirect_enabled && !modalRedirectUrl.trim()) {
            setRedirectError('Redirect URL cannot be empty.');
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch(route('form.updateSettings', { ...query, id: modalForm.id }), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_login: modalForm.client_login,
                    redirect_enabled: modalForm.redirect_enabled,
                    email_required: modalForm.email_required,
                    allow_file_upload: modalForm.allow_file_upload,
                    email: modalForm.email_required ? modalEmail : null,
                    redirect_url: modalForm.redirect_enabled ? modalRedirectUrl : null,
                }),
            });
            if (!res.ok) throw new Error('Failed to update settings');

            setForms(prev => prev.map(f =>
                f.id === modalForm.id
                    ? { ...f, ...modalForm, email: modalEmail, redirect_url: modalRedirectUrl }
                    : f
            ));
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update settings. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        async function fetchForms() {
            try {
                const statusFilter = tabs[selectedTab].id !== 'all' ? { status: tabs[selectedTab].id } : {};
                const response = await fetch(route('form.index', {
                    ...query,
                    page,
                    limit: perPage,
                    search: debouncedQuery,
                    ...statusFilter,
                }));
                const data = await response.json();
                setForms(data.data.map(f => ({ ...f, id: f.id.toString() })));
                setTotal(data.total);
            } catch (err) {
                console.error("Failed to fetch forms:", err);
            }
        }
        fetchForms();
    }, [page, perPage, debouncedQuery, selectedTab, tabs]);

    const resourceName = { singular: 'form', plural: 'forms' };

    const rowMarkup = forms.map((form, index) => {
        const clientLogin = form.client_login ?? false;
        const redirectEnabled = form.redirect_enabled ?? false;
        const emailNotification = form.email_required ?? true;
        const fileUpload = form.allow_file_upload ?? false;

        return (
            <IndexTable.Row key={form.id} id={form.id} position={index}>
                <IndexTable.Cell><Text fontWeight="bold">{form.name}</Text></IndexTable.Cell>
                <IndexTable.Cell><StatusIcon tone="base" isTrue={clientLogin} /></IndexTable.Cell>
                <IndexTable.Cell><StatusIcon tone="base" isTrue={redirectEnabled} /></IndexTable.Cell>
                <IndexTable.Cell><StatusIcon tone="base" isTrue={emailNotification} /></IndexTable.Cell>
                <IndexTable.Cell><StatusIcon tone="base" isTrue={fileUpload} /></IndexTable.Cell>
                <IndexTable.Cell>
                    <Button variant='secondary' onClick={() => handleManageSettings(form)}>
                        Manage Settings
                    </Button>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Select
                        options={[
                            { label: 'Draft', value: 'draft' },
                            { label: 'Active', value: 'active' }
                        ]}
                        value={form.status}
                        disabled={form.updatingStatus}
                        onChange={async (newStatus) => {
                            setForms(prev =>
                                prev.map(f =>
                                    f.id === form.id ? { ...f, updatingStatus: true } : f
                                )
                            );
                            try {
                                const res = await fetch(route('form.updateStatus', { ...query, id: form.id }), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                });
                                if (!res.ok) throw new Error('Failed to update status');
                                setForms(prev =>
                                    prev.map(f =>
                                        f.id === form.id
                                            ? { ...f, status: newStatus, updatingStatus: false }
                                            : f
                                    )
                                );
                            } catch {
                                setForms(prev =>
                                    prev.map(f =>
                                        f.id === form.id ? { ...f, updatingStatus: false } : f
                                    )
                                );
                                alert('Failed to update status.');
                            }
                        }}
                    />
                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    const totalPages = Math.ceil(total / perPage);

    return (
        <Box paddingInline="600">
            <Page
                title="Forms"
                backAction={{ content: 'Dashboard' }}
                primaryAction={<Button variant='primary' onClick={() => router.visit(route('form.view', query))}>Create New Form</Button>}
            >
                <Card>
                    <IndexFilters
                        tabs={tabs}
                        selected={selectedTab}
                        onSelect={handleTabChange}
                        queryValue={queryValue}
                        onQueryChange={setQueryValue}
                        onQueryClear={() => setQueryValue('')}
                        filters={[]}
                        canCreateNewView={false}
                        appliedFilters={[]}
                        mode={mode}
                        setMode={setMode}
                    />
                </Card>

                <Box paddingBlockStart="400">
                    <Card>
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={total}
                            headings={[
                                { title: 'Form Name' },
                                { title: 'Client Login' },
                                { title: 'Redirect URL' },
                                { title: 'Email Notification' },
                                { title: 'File Upload' },
                                { title: 'Actions' },
                                { title: 'Status' },
                            ]}
                            emptyStateContent="No forms found"
                            compact={breakpoints.smDown}
                        >
                            {rowMarkup.length > 0 ? rowMarkup : (
                                <IndexTable.Row>
                                    <IndexTable.Cell colSpan={7}>
                                        <Box padding="400" textAlign="center">
                                            <Text alignment="center" variant="bodyMd" tone="subdued">
                                                No forms found.
                                            </Text>
                                        </Box>
                                    </IndexTable.Cell>
                                </IndexTable.Row>
                            )}
                        </IndexTable>

                        {totalPages > 1 && (
                            <Box padding="300">
                                <InlineStack align="end">
                                    <Pagination
                                        hasPrevious={page > 1}
                                        onPrevious={() => setPage(page - 1)}
                                        hasNext={page < totalPages}
                                        onNext={() => setPage(page + 1)}
                                    />
                                </InlineStack>
                            </Box>
                        )}
                    </Card>
                </Box>

                {/* MODAL FOR SETTINGS */}
                {modalForm && (
                    <Modal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        title={`Manage Settings - ${modalForm.name}`}
                        primaryAction={{
                            content: updating ? 'Updating...' : 'Update',
                            onAction: handleModalUpdate,
                            loading: updating,
                        }}
                    >
                        <Modal.Section>
                            <BlockStack>
                                <CheckBox
                                    label="Client Login"
                                    checked={modalForm.client_login}
                                    onChange={(value) => setModalForm({ ...modalForm, client_login: value })}
                                />

                                <CheckBox
                                    label="Redirect URL Enabled"
                                    checked={modalForm.redirect_enabled}
                                    onChange={(value) => setModalForm({ ...modalForm, redirect_enabled: value })}
                                />
                                {modalForm.redirect_enabled && (
                                    <TextField
                                        label="Redirect URL"
                                        value={modalRedirectUrl}
                                        onChange={setModalRedirectUrl}
                                        error={redirectError}
                                    />
                                )}

                                <CheckBox
                                    label="Email Notification"
                                    checked={modalForm.email_required}
                                    onChange={(value) => setModalForm({ ...modalForm, email_required: value })}
                                />
                                {modalForm.email_required && (
                                    <TextField
                                        label="Notification Email"
                                        value={modalEmail}
                                        onChange={setModalEmail}
                                        type="email"
                                        error={emailError}
                                    />
                                )}

                                <CheckBox
                                    label="Allow File Upload"
                                    checked={modalForm.allow_file_upload}
                                    onChange={(value) => setModalForm({ ...modalForm, allow_file_upload: value })}
                                />
                            </BlockStack>
                        </Modal.Section>
                    </Modal>
                )}
            </Page>
        </Box>
    );
}
