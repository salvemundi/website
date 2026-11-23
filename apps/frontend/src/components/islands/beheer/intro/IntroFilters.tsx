import { Download, Users, Heart, Calendar, ShieldCheck, Users2 } from 'lucide-react';
import { Badge, Box, Button, Group, Select, Stack, Tabs } from '@mantine/core';
import IntroStudentSignupToggleIsland from './IntroStudentSignupToggleIsland';
import IntroParentSignupToggleIsland from './IntroParentSignupToggleIsland';

export type TabType = 'signups' | 'parents' | 'planning' | 'confidants' | 'groups';

interface IntroFiltersProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onExport: () => void;
    counts: Record<TabType, number>;
    studentSignupsOpen: boolean;
    parentSignupsOpen: boolean;
}

export default function IntroFilters({
    activeTab,
    onTabChange,
    onExport,
    counts,
    studentSignupsOpen,
    parentSignupsOpen
}: IntroFiltersProps) {
    const tabs = [
        { id: 'signups', label: 'Aanmeldingen', count: counts.signups, icon: Users },
        { id: 'parents', label: 'Ouders', count: counts.parents, icon: Heart },
        { id: 'planning', label: 'Planning', count: counts.planning, icon: Calendar },
        { id: 'confidants', label: 'Vertrouwenspersonen', count: counts.confidants, icon: ShieldCheck },
        { id: 'groups', label: 'Groepen', count: counts.groups, icon: Users2 }
    ] as const;

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    return (
        <Stack gap="md" mb="md">
            <Group justify="flex-end" gap="xs" wrap="wrap">
                {activeTab === 'signups' && (
                    <IntroStudentSignupToggleIsland initialOpen={studentSignupsOpen} />
                )}
                {activeTab === 'parents' && (
                    <IntroParentSignupToggleIsland initialOpen={parentSignupsOpen} />
                )}
                {(activeTab === 'signups' || activeTab === 'parents') && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onExport}
                        leftSection={<Download size={16} />}
                    >
                        Exporteer CSV
                    </Button>
                )}
            </Group>

            <Box hiddenFrom="lg">
                <Select
                    value={activeTab}
                    onChange={(val) => {
                        if (val) onTabChange(val as TabType);
                    }}
                    allowDeselect={false}
                    leftSection={activeTabInfo ? <activeTabInfo.icon size={16} /> : undefined}
                    data={tabs.map((tab) => ({
                        value: tab.id,
                        label: `${tab.label} (${tab.count})`,
                    }))}
                    aria-label="Selecteer introductie tabblad"
                />
            </Box>

            <Box visibleFrom="lg">
                <Tabs
                    value={activeTab}
                    onChange={(val) => {
                        if (val) onTabChange(val as TabType);
                    }}
                >
                    <Tabs.List>
                        {tabs.map((tab) => (
                            <Tabs.Tab
                                key={tab.id}
                                value={tab.id}
                                leftSection={<tab.icon size={16} />}
                                rightSection={
                                    <Badge
                                        size="xs"
                                        variant={activeTab === tab.id ? 'white' : 'default'}
                                        color={activeTab === tab.id ? 'accent' : undefined}
                                    >
                                        {tab.count}
                                    </Badge>
                                }
                            >
                                {tab.label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs>
            </Box>
        </Stack>
    );
}
