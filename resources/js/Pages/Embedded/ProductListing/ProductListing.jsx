import React, { useEffect, useState, useCallback } from 'react';
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
    useIndexResourceState,
    useSetIndexFiltersMode,
    Badge,
    Pagination,
    Modal,
    TextField,
    Checkbox,
    Spinner,
    Select
} from '@shopify/polaris';
import { usePage } from '@inertiajs/react';

// Debounce hook
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}

const StatusIcon = ({ isTrue }) => (
    isTrue ? <Badge tone="success" size="small">✓</Badge> : <Badge tone="critical" size="small">✗</Badge>
);

export default function Products() {
    const [products, setProducts] = useState([]);
    const [queryValue, setQueryValue] = useState('');
    const debouncedQuery = useDebounce(queryValue, 500);
    const [selectedTab, setSelectedTab] = useState(0);
    const { props } = usePage();
    const query = props?.ziggy?.query;

    // Pagination
    const [page, setPage] = useState(1);
    const [perPage] = useState(5);
    const [total, setTotal] = useState(0);

    const { mode, setMode } = useSetIndexFiltersMode();
    const breakpoints = useBreakpoints();

    const tabs = [
        { id: 'all', content: 'All' },
        { id: 'draft', content: 'Draft' },
        { id: 'archived', content: 'Archived' },
    ];

    const handleTabChange = useCallback((index) => {
        setSelectedTab(index);
        setPage(1);
    }, []);

    // Fetch products
    useEffect(() => {
        async function fetchProducts() {
            try {
                const statusFilter = tabs[selectedTab].id !== 'all' ? { status: tabs[selectedTab].id } : {};
                const response = await fetch(route('products.index', { ...query, page, limit: perPage, search: debouncedQuery, ...statusFilter }));
                const data = await response.json();

                const stringifiedProducts = data.data.map(product => ({ ...product, id: product.id.toString() }));
                setProducts(stringifiedProducts);
                setTotal(data.total);
            } catch (error) {
                console.error('Failed to load products:', error);
            }
        }
        fetchProducts();
    }, [page, perPage, debouncedQuery, selectedTab]);

    const resourceName = { singular: 'product', plural: 'products' };
    const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(products);

    // Modal state
    const [modalActive, setModalActive] = useState(false);

    // Form selection modal
    const [formPickerActive, setFormPickerActive] = useState(false);
    const [selectedFormName, setSelectedFormName] = useState('');
    const [selectedFormId, setSelectedFormId] = useState(null);

    // Form list
    const [formSearch, setFormSearch] = useState('');
    const debouncedFormSearch = useDebounce(formSearch, 300);
    const [forms, setForms] = useState([]);
    const [loadingForms, setLoadingForms] = useState(false);

    // Extra options
    const [hidePrice, setHidePrice] = useState(false);
    const [hideSKU, setHideSKU] = useState(false);
    const [addToCart, setAddToCart] = useState(true);

    // Fetch forms
    useEffect(() => {
        async function fetchForms() {
            try {
                setLoadingForms(true);
                const response = await fetch(route('forms.getforms', query), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        search: debouncedFormSearch,
                        limit: 10,
                    }),
                });
                const data = await response.json();
                setForms(data);

                // AUTO SELECT WHEN ONLY ONE FORM EXISTS
                if (data.length === 1) {
                    const onlyForm = data[0];
                    setSelectedFormId(onlyForm.form_id.toString());
                    setSelectedFormName(onlyForm.form_name);
                }

            } catch (err) {
                console.error('Failed to load forms', err);
            } finally {
                setLoadingForms(false);
            }
        }
        fetchForms();
    }, [debouncedFormSearch]);


    const handleOpenModal = () => {
        if (selectedResources.length === 0) {
            alert('Please select at least one product before assigning a form.');
            return;
        }
        setModalActive(true);
    };

    const handleAssignForm = async () => {
        if (!selectedFormId) return;

        try {
            await fetch(route('products.assignForm', query), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_ids: selectedResources,
                    form_id: selectedFormId,
                    hide_price: hidePrice,
                    hide_sku: hideSKU,
                    add_to_cart: addToCart,
                }),
            });

            setModalActive(false);
            setSelectedFormId(null);
            setSelectedFormName('');
            setHidePrice(false);
            setHideSKU(false);
            setAddToCart(true);

            alert('Form assigned successfully!');
        } catch (err) {
            console.error('Failed to assign form', err);
        }
    };

    // Table rows
    const rowMarkup = products.map((product, index) => {
        const variant = product.product_varients?.[0];
        const price = variant?.price || 0;
        const tags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        const firstTag = tags[0];
        const remainingTagsCount = tags.length - 1;

        return (
            <IndexTable.Row
                id={product.id}
                key={product.id}
                position={index}
                selected={selectedResources.includes(product.id)}
            >
                <IndexTable.Cell>
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 6,
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 50,
                                height: 50,
                                background: '#eee',
                                borderRadius: 6,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            IMG
                        </div>
                    )}
                </IndexTable.Cell>
                <IndexTable.Cell><Text fontWeight="bold">{product.title}</Text></IndexTable.Cell>
                <IndexTable.Cell><Badge>{product.product_type || ''}</Badge></IndexTable.Cell>
                <IndexTable.Cell>{product.vendor || ''}</IndexTable.Cell>
                <IndexTable.Cell>
                    <InlineStack gap="100" wrap={false}>
                        {firstTag && <Badge tone="success">{firstTag}</Badge>}
                        {remainingTagsCount > 0 && <Badge tone="info">+{remainingTagsCount}</Badge>}
                        {!firstTag && ''}
                    </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>${Number(price).toFixed(2)}</IndexTable.Cell>
                <IndexTable.Cell><StatusIcon isTrue={product.hide_price ?? false} /></IndexTable.Cell>
                <IndexTable.Cell><StatusIcon isTrue={product.hide_SKU ?? false} /></IndexTable.Cell>
                <IndexTable.Cell><StatusIcon isTrue={product.hide_add_to_cart ?? false} /></IndexTable.Cell>
                <IndexTable.Cell>{product.form_name || ''}</IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    const totalPages = Math.ceil(total / perPage);

    return (
        <Box paddingInline="600">
            <Page title="Products" primaryAction={<Button variant='primary' size='large' onClick={handleOpenModal}>Setup & Assign</Button>}>

                <Card>
                    <IndexFilters
                        tabs={tabs}
                        selected={selectedTab}
                        onSelect={handleTabChange}
                        queryValue={queryValue}
                        onQueryChange={setQueryValue}
                        onQueryClear={() => setQueryValue('')}
                        filters={[]}
                        appliedFilters={[]}
                        canCreateNewView={false}
                        mode={mode}
                        setMode={setMode}
                    />
                </Card>

                <Box paddingBlockStart="400">
                    <Card>
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={products.length}
                            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: 'Image' },
                                { title: 'Name' },
                                { title: 'Type' },
                                { title: 'Vendor' },
                                { title: 'Tags' },
                                { title: 'Price' },
                                { title: 'Hide Price' },
                                { title: 'Hide SKU' },
                                { title: 'Add to Cart' },
                                { title: 'Assigned Form' }
                            ]}
                            compact={breakpoints.smDown}
                        >
                            {rowMarkup}
                        </IndexTable>

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
                    </Card>
                </Box>
            </Page>

            {/* MAIN MODAL */}
            <Modal
                open={modalActive}
                onClose={() => setModalActive(false)}
                title="Setup & Assign Form"
                primaryAction={{ content: 'Assign Form', onAction: handleAssignForm, disabled: !selectedFormId }}
            >
                <Modal.Section>
                    <TextField
                        label="Selected Form"
                        value={selectedFormName}
                        readOnly
                        placeholder="Click to choose a form"
                        onFocus={() => setFormPickerActive(true)}
                    />
                </Modal.Section>

                <Modal.Section title="Settings">
                    <Checkbox label="Hide Price" checked={hidePrice} onChange={setHidePrice} />
                    <Checkbox label="Hide SKU" checked={hideSKU} onChange={setHideSKU} />
                    <Checkbox label="Add to Cart" checked={addToCart} onChange={setAddToCart} />
                </Modal.Section>
            </Modal>

            {/* FORM PICKER MODAL */}
            <Modal
                open={formPickerActive}
                onClose={() => setFormPickerActive(false)}
                title="Select a Form"
                primaryAction={{
                    content: 'Select',
                    onAction: () => {
                        if (selectedFormId) {
                            setFormPickerActive(false);
                        }
                    },
                    disabled: !selectedFormId
                }}
            >
                <Modal.Section>
                    <TextField
                        label="Search Forms"
                        value={formSearch}
                        onChange={setFormSearch}
                        placeholder="Search forms..."
                        autoComplete="off"
                    />

                    {loadingForms && <Spinner size="small" />}

                    <Box paddingBlockStart="200">
                        {forms.length > 0 ? (
                            <Select
                                label="Available Forms"
                                options={forms.map(form => ({
                                    label: form.form_name,
                                    value: form.form_id.toString(),
                                }))}
                                onChange={(value) => {
                                    setSelectedFormId(value);
                                    const chosen = forms.find(f => f.form_id.toString() === value);
                                    setSelectedFormName(chosen?.form_name ?? '');
                                }}
                                value={selectedFormId ?? ''}
                            />
                        ) : (
                            <Text>No forms found</Text>
                        )}
                    </Box>
                </Modal.Section>
            </Modal>

        </Box>
    );
}
