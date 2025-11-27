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
    Badge,
    Pagination,
    useBreakpoints,
    useIndexResourceState,
    useSetIndexFiltersMode,
} from '@shopify/polaris';
import { router, usePage } from '@inertiajs/react';
import { capitalize } from '@mui/material';

// Helper to truncate long text
const truncate = (text, length = 40) =>
    text?.length > length ? text.substring(0, length) + '...' : text;

// -----------------------------
// Helper function for button logic
// -----------------------------

const handleCreateOrder = (quote, query) => {

    try {

        const url = route('quotes.createOrder', {
            ...query,
            quotation_id: quote.quotation_id,
        });
        fetch(url, {
            method: 'POST',
        }).then(response => response.json())
            .then(data => {
                if (data.order) {
                    alert(`Order ${data.order.id} created successfully for quote ${quote.quotation_id}`);
                } else {
                    alert(`Failed to create order for quote ${quote.quotation_id}`);
                }
            })
            .catch(error => {
                console.error('Error creating order:', error);
                alert(`Error creating order for quote ${quote.quotation_id}`);
            });
    } catch (error) {
        console.error('Exception in handleCreateOrder:', error);
        alert(`Exception occurred while creating order for quote ${quote.quotation_id}`);
    }
};

const handleArchiveProposal = async (action, quotation_id) => {

    try {
        const response = await fetch(`/proposal/${action}/${quotation_id}`, {
            method: "POST",
        })
        const data = await response.json();
        if (data.message) {
            alert(data.message);
        } else {
            alert('Action completed successfully.');
        }
    }
    catch (error) {
        console.error('Error: ', error)
    }
}
const getActionForStatus = (quote, query) => {
    switch (quote.status) {
        case 'pending':
            return {
                label: 'Send Proposal', variant: 'primary', onClick: (e) => {
                    router.visit(route('proposal', {
                        ...query,
                        quote,
                    }))
                }
            };
        case 'quoted':
            return {
                label: 'View Proposal', variant: 'secondary', onClick: (e) => {
                    router.visit(route('proposal', {
                        ...query,
                        quote,
                    }))
                }
            };
        case 'accepted':
            return { label: 'Create Order', variant: 'primary', onClick: () => handleCreateOrder(quote, query) };
        case 'rejected':
        case 'expired':
            return { label: 'Archive Proposal', variant: 'destructive', onClick: () => handleArchiveProposal('archive', quote.quotation_id) };
        default:
            return {
                label: 'View Proposal', variant: 'secondary', onClick: (e) => {
                    router.visit(route('proposal', {
                        ...query,
                        quote,
                    }))
                }
            };
    }
};

// -----------------------------
// Main Component
// -----------------------------
export default function Quotes() {

    const [quotes, setQuotes] = useState([]);
    const [queryValue, setQueryValue] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(5);
    const [total, setTotal] = useState(0);
    const { props } = usePage();
    const query = props?.ziggy?.query;
    const { mode, setMode } = useSetIndexFiltersMode();
    const breakpoints = useBreakpoints();

    const tabs = [
        { id: 'all', content: 'All' },
        { id: 'pending', content: 'Pending' },
        { id: 'quoted', content: 'Sent' },
        { id: 'archived', content: 'Archived' },
    ];

    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = useCallback((index) => {
        setSelectedTab(index);
        setPage(1);
    }, []);

    // -----------------------------
    // Fetch quotes from backend
    // -----------------------------
    useEffect(() => {
        async function loadQuotes() {
            try {
                const statusFilter = tabs[selectedTab].id !== 'all'
                    ? { status: tabs[selectedTab].id }
                    : {};

                const url = route('quotes.index', {
                    ...query,
                    page,
                    limit: perPage,
                    search: queryValue,
                    ...statusFilter
                });

                const res = await fetch(url);
                const json = await res.json();

                if (!json.quotes || !json.quotes.data) {
                    console.error("❌ Backend structure wrong:", json);
                    return;
                }

                // Backend returns numeric array in quotes.data now
                const cleaned = json.quotes.data.data.map(q => ({
                    ...q,
                    id: q.id.toString()
                }));
                console.log("✅ Loaded quotes:", cleaned);

                setQuotes(cleaned);
                setTotal(json.quotes.total);

            } catch (err) {
                console.error("Failed to load quotes:", err);
            }
        }

        loadQuotes();
    }, [page, selectedTab, queryValue]);

    const resourceName = { singular: 'quote', plural: 'quotes' };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(quotes);

    const totalPages = Math.ceil(total / perPage);

    // -----------------------------
    // Table Rows
    // -----------------------------
    const rowMarkup = quotes.map((quote, index) => {

        const { label, variant, onClick } = getActionForStatus(quote, query);

        return (
            <IndexTable.Row
                id={quote.id}
                key={quote.id}
                position={index}
                selected={selectedResources.includes(quote.id)}
            >
                <IndexTable.Cell>
                    <Text fontWeight="bold">{quote.quotation_id}</Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                    {quote.order_id ?? '—'}
                </IndexTable.Cell>

                <IndexTable.Cell>
                    {quote.customer_name ?? '—'}
                </IndexTable.Cell>

                <IndexTable.Cell>
                    <Text as="p">{quote.customer_email ?? '—'}</Text>
                    <Text tone="subdued" as="p" variant="bodySm">
                        {truncate(quote.shipping_address ?? '—')}
                    </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                    <Badge tone={
                        quote.status === 'pending' ? 'attention' :
                            quote.status === 'quoted' ? 'info' :
                                quote.status === 'accepted' ? 'success' :
                                    quote.status === 'archived' ? 'critical' :
                                        quote.status === 'rejected' ? 'critical' :
                                            'default'
                    }>
                        {capitalize(quote.status)}
                    </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {quote.quantity ?? '—'}
                </IndexTable.Cell>

                <IndexTable.Cell>
                    {`PKR ${quote.price * quote.quantity}` ?? '—'}
                </IndexTable.Cell>

                <IndexTable.Cell>
                    {quote.proposal ? `PKR ${quote.proposal.proposal_price}` : '—'}
                </IndexTable.Cell>

                <IndexTable.Cell>
                    <Button variant={variant} onClick={onClick}>{label}</Button>
                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    // -----------------------------
    // JSX Render
    // -----------------------------
    return (
        <Box paddingInline="600">
            <Page title="Quotes">

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
                            itemCount={quotes.length}
                            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: 'Quotation ID' },
                                { title: 'Order ID' },
                                { title: 'Customer Name' },
                                { title: 'Customer Details' },
                                { title: 'Status' },
                                { title: 'Quantity' },
                                { title: 'Price' },
                                { title: 'Proposal Price' },
                                { title: 'Action' }
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
        </Box>
    );
}
