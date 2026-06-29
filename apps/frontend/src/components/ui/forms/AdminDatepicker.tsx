import React from 'react';
import { Datepicker } from 'flowbite-react';

const customDatepickerTheme: React.ComponentProps<typeof Datepicker>['theme'] = {
    root: {
        input: {
            field: {
                icon: {
                    base: "hidden",
                    svg: "hidden"
                },
                input: {
                    colors: {
                        gray: "bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text) rounded-(--beheer-radius) font-bold text-sm transition-all focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) px-3 py-2.5 text-ellipsis"
                    },
                    withIcon: {
                        on: "pl-3",
                        off: "pl-3"
                    }
                }
            }
        }
    },
    popup: {
        root: {
            inner: "inline-block rounded-xl bg-(--beheer-card-bg) border border-(--beheer-border) p-4 shadow-xl text-(--beheer-text)"
        },
        header: {
            title: "px-2 py-3 text-center text-sm font-semibold text-(--beheer-text)",
            selectors: {
                button: {
                    base: "rounded-lg px-3 py-1.5 text-xs font-semibold text-(--beheer-text) bg-transparent hover:bg-(--beheer-accent)/15 transition-colors dark:bg-transparent",
                    prev: "text-(--beheer-text) hover:bg-(--beheer-accent)/15 bg-transparent dark:bg-transparent",
                    next: "text-(--beheer-text) hover:bg-(--beheer-accent)/15 bg-transparent dark:bg-transparent",
                    view: "text-(--beheer-text) hover:bg-(--beheer-accent)/15 bg-transparent dark:bg-transparent"
                }
            }
        },
        footer: {
            base: "mt-4 flex space-x-2 border-t border-(--beheer-border) pt-3",
            button: {
                base: "w-full rounded-lg text-center text-xs font-bold px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-(--beheer-accent)/20",
                today: "bg-(--beheer-accent) text-white hover:bg-(--beheer-accent)/90",
                clear: "border border-(--beheer-border) text-(--beheer-text) bg-transparent hover:bg-(--beheer-accent)/10 dark:bg-transparent"
            }
        }
    },
    views: {
        days: {
            header: {
                base: "mb-1 grid grid-cols-7",
                title: "h-6 text-center text-xs font-bold leading-6 text-(--beheer-text-muted)"
            },
            items: {
                base: "grid w-64 grid-cols-7",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-(--beheer-text) hover:bg-(--beheer-accent)/10 transition-colors",
                    selected: "bg-(--beheer-accent) text-white hover:bg-(--beheer-accent)",
                    disabled: "text-(--beheer-text-muted) opacity-30 cursor-not-allowed",
                    today: "border border-(--beheer-accent)/45 text-(--beheer-accent)"
                }
            }
        },
        months: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-(--beheer-text) hover:bg-(--beheer-accent)/10 transition-colors",
                    selected: "bg-(--beheer-accent) text-white hover:bg-(--beheer-accent)",
                    disabled: "text-(--beheer-text-muted) opacity-30 cursor-not-allowed"
                }
            }
        },
        years: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-(--beheer-text) hover:bg-(--beheer-accent)/10 transition-colors",
                    selected: "bg-(--beheer-accent) text-white hover:bg-(--beheer-accent)",
                    disabled: "text-(--beheer-text-muted) opacity-30 cursor-not-allowed"
                }
            }
        },
        decades: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-(--beheer-text) hover:bg-(--beheer-accent)/10 transition-colors",
                    selected: "bg-(--beheer-accent) text-white hover:bg-(--beheer-accent)",
                    disabled: "text-(--beheer-text-muted) opacity-30 cursor-not-allowed"
                }
            }
        }
    }
};

type AdminDatepickerProps = Omit<React.ComponentProps<typeof Datepicker>, 'theme'>;

export const AdminDatepicker = React.forwardRef<React.ElementRef<typeof Datepicker>, AdminDatepickerProps>(({
    language = "nl",
    labelTodayButton = "Vandaag",
    labelClearButton = "Wissen",
    weekStart = 1,
    onClick,
    defaultValue: _defaultValue,
    ...props
}, ref) => {
    return (
        <Datepicker
            theme={customDatepickerTheme}
            language={language}
            labelTodayButton={labelTodayButton}
            labelClearButton={labelClearButton}
            weekStart={weekStart}
            ref={ref}
            onClick={(e) => {
                e.currentTarget.blur();
                e.currentTarget.focus();
                if (onClick) onClick(e);
            }}
            icon={undefined}
            label={props.label || ""}
            {...props}
            value={props.value === null ? undefined : props.value}
        />
    );
});

AdminDatepicker.displayName = 'AdminDatepicker';
