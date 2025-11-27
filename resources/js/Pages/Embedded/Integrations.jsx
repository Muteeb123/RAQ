import { useState } from 'react';
import { InlineStack, Page } from '@shopify/polaris';
import '../../../css/IntegrationSection.css';
import { usePage } from '@inertiajs/react';

const IntegrationSection = ({ integrations }) => {
    const { props } = usePage();
    const query = props?.ziggy?.query;

    const platforms = ['slack', 'discord'];

    // Prepare initial backend state
    const initialState = platforms.map(platform => {
        const backendIntegration = integrations?.find(intg => intg.platform === platform);
        return {
            platform,
            apiKey: backendIntegration?.apiKey || '',
            status: backendIntegration?.status || 'disconnected',
        };
    });

    const [integrationState, setIntegrationState] = useState(initialState);

    // Store API input for NEW integrations only
    const [apiInputs, setApiInputs] = useState({
        slack: '',
        discord: '',
    });

    const handleInputChange = (platform, value) => {
        setApiInputs(prev => ({
            ...prev,
            [platform]: value,
        }));
    };

    const handleConnect = async (platform, apiKey) => {
        if (!apiKey) {
            alert('Please enter a valid API key.');
            return;
        }

        try {
            const response = await fetch(route('integrations.connect', query), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, apiKey, status: 'connected' }),
            });

            if (response.ok) {
                setIntegrationState(prev =>
                    prev.map(intg =>
                        intg.platform === platform
                            ? { ...intg, apiKey, status: 'connected' }
                            : intg
                    )
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDisconnect = async platform => {
        try {
            const response = await fetch(route('integrations.disconnect', query), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, status: 'disconnected' }),
            });

            if (response.ok) {
                setIntegrationState(prev =>
                    prev.map(intg =>
                        intg.platform === platform
                            ? { ...intg, status: 'disconnected' }
                            : intg
                    )
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async platform => {
        try {
            const response = await fetch(route('integrations.remove', query), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform }),
            });

            if (response.ok) {
                setIntegrationState(prev =>
                    prev.map(intg =>
                        intg.platform === platform
                            ? { ...intg, apiKey: '', status: 'disconnected' }
                            : intg
                    )
                );

                // Clear input for that platform
                setApiInputs(prev => ({
                    ...prev,
                    [platform]: '',
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Page
            title="Integration"
            backAction={{ content: '', url: '' }}
            subtitle="Connect your favorite tools to streamline workflows and enhance functionality from analytics to communication platforms."
        >
            <div className="integration-container">
                <div className="integration-grid">
                    {integrationState.map(intg => {
                        const isConnected = intg.status === 'connected';

                        return (
                            <div className="integration-card" key={intg.platform}>
                                <div className="integration-header-row">
                                    <div className={`integration-icon ${intg.platform}-icon`}>
                                        {intg.platform === 'slack' ? (
                                            <img
                                                src="https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg"
                                                alt="Slack"
                                                style={{ width: 32, height: 32 }}
                                            />
                                        ) : intg.platform === 'discord' ? (
                                            <img
                                                src="https://cdn.worldvectorlogo.com/logos/discord-6.svg"
                                                alt="Discord"
                                                style={{ width: 32, height: 32 }}
                                            />
                                        ) : null}
                                    </div>
                                    <div className="integration-info">
                                        <div className="integration-title-row">
                                            <h3 className="integration-name">{intg.platform}</h3>

                                            <span className={`status-badge ${isConnected ? 'connected' : 'not-connected'}`}>
                                                {isConnected ? 'Connected' : 'Not Connected'}
                                            </span>
                                        </div>

                                        <p className="integration-description">
                                            {intg.platform === 'slack'
                                                ? 'Connect your Slack workspace to receive real-time notifications from your Shopify proposals.'
                                                : 'Integrate with Discord to get instant updates on proposals directly in your server channels.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="api-section">

                                    {/* If backend API key exists (connected or disconnected), always show masked and uneditable */}
                                    {intg.apiKey ? (
                                        <>
                                            <label className="api-label">API Key</label>

                                            <input
                                                type="text"
                                                className="api-input"
                                                value={`${intg.apiKey.slice(0, 4)}****${intg.apiKey.slice(-4)}`}
                                                readOnly
                                            />

                                            {/* Connected → Disconnect + Remove */}
                                            {isConnected ? (
                                                <InlineStack gap={400}>
                                                    <button
                                                        className="connect-button"
                                                        onClick={() => handleDisconnect(intg.platform)}
                                                    >
                                                        Disconnect
                                                    </button>

                                                    <button
                                                        className="connect-button"
                                                        onClick={() => handleRemove(intg.platform)}
                                                    >
                                                        Remove
                                                    </button>
                                                </InlineStack>
                                            ) : (
                                                /* Disconnected → Connect + Remove */
                                                <InlineStack gap={400}>

                                                    <button
                                                        className="connect-button"
                                                        onClick={() => handleConnect(intg.platform, intg.apiKey)}
                                                    >
                                                        Connect
                                                    </button>

                                                    <button
                                                        className="connect-button"
                                                        onClick={() => handleRemove(intg.platform)}
                                                    >
                                                        Remove
                                                    </button>
                                                </InlineStack>
                                            )}
                                        </>
                                    ) : (
                                        /* No backend entry (new integration) */
                                        <>
                                            <label className="api-label">Enter API Key</label>

                                            <input
                                                type="text"
                                                className="api-input"
                                                placeholder="Enter your API key"
                                                value={apiInputs[intg.platform]}
                                                onChange={e => handleInputChange(intg.platform, e.target.value)}
                                            />

                                            <button
                                                className="connect-button"
                                                onClick={() =>
                                                    handleConnect(intg.platform, apiInputs[intg.platform])
                                                }
                                            >
                                                Connect
                                            </button>
                                        </>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Page>
    );
};

export default IntegrationSection;
