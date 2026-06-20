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
                        gray: "bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] font-bold text-sm transition-all focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] px-3 py-2.5 text-ellipsis"
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
            inner: "inline-block rounded-xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] p-4 shadow-xl text-[var(--beheer-text)]"
        },
        header: {
            title: "px-2 py-3 text-center text-sm font-semibold text-[var(--beheer-text)]",
            selectors: {
                button: {
                    base: "rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--beheer-text)] bg-transparent hover:bg-[var(--beheer-accent)]/15 transition-colors dark:bg-transparent",
                    prev: "text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/15 bg-transparent dark:bg-transparent",
                    next: "text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/15 bg-transparent dark:bg-transparent",
                    view: "text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/15 bg-transparent dark:bg-transparent"
                }
            }
        },
        footer: {
            base: "mt-4 flex space-x-2 border-t border-[var(--beheer-border)] pt-3",
            button: {
                base: "w-full rounded-lg text-center text-xs font-bold px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--beheer-accent)]/20",
                today: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]/90",
                clear: "border border-[var(--beheer-border)] text-[var(--beheer-text)] bg-transparent hover:bg-[var(--beheer-accent)]/10 dark:bg-transparent"
            }
        }
    },
    views: {
        days: {
            header: {
                base: "mb-1 grid grid-cols-7",
                title: "h-6 text-center text-xs font-bold leading-6 text-[var(--beheer-text-muted)]"
            },
            items: {
                base: "grid w-64 grid-cols-7",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/10 transition-colors",
                    selected: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]",
                    disabled: "text-[var(--beheer-text-muted)] opacity-30 cursor-not-allowed",
                    today: "border border-[var(--beheer-accent)]/45 text-[var(--beheer-accent)]"
                }
            }
        },
        months: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/10 transition-colors",
                    selected: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]",
                    disabled: "text-[var(--beheer-text-muted)] opacity-30 cursor-not-allowed"
                }
            }
        },
        years: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/10 transition-colors",
                    selected: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]",
                    disabled: "text-[var(--beheer-text-muted)] opacity-30 cursor-not-allowed"
                }
            }
        },
        decades: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-[var(--beheer-text)] hover:bg-[var(--beheer-accent)]/10 transition-colors",
                    selected: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]",
                    disabled: "text-[var(--beheer-text-muted)] opacity-30 cursor-not-allowed"
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
            {...props}
        />
    );
});

AdminDatepicker.displayName = 'AdminDatepicker';
