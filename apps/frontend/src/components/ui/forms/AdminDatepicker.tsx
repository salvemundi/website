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
                    base: "block w-full disabled:cursor-not-allowed disabled:opacity-40 outline-none",
                    colors: {
                        gray: "beheer-input !w-full !bg-(--beheer-card-bg) dark:!bg-(--beheer-card-bg) !border !border-(--beheer-border) dark:!border-(--beheer-border) !text-(--beheer-text) dark:!text-(--beheer-text) !rounded-(--beheer-radius) font-bold text-sm transition-all focus:!ring-4 focus:!ring-(--beheer-accent)/10 focus:!border-(--beheer-accent) !px-5 !py-2.5 text-ellipsis placeholder:!text-(--beheer-text-muted) dark:placeholder:!text-(--beheer-text-muted)"
                    },
                    withIcon: {
                        on: "pl-5",
                        off: "pl-5"
                    }
                }
            }
        }
    },
    popup: {
        root: {
            base: "absolute top-full left-0 z-50 block pt-2 max-w-[calc(100vw-2rem)]",
            inner: "inline-block rounded-2xl !bg-(--bg-card) dark:!bg-(--bg-card) !border !border-(--border-color)/40 dark:!border-white/10 p-4 shadow-xl !text-(--text-main) dark:!text-(--text-main)"
        },
        header: {
            title: "px-2 py-3 text-center text-sm font-bold !text-(--text-main) dark:!text-(--text-main)",
            selectors: {
                button: {
                    base: "rounded-xl px-3 py-1.5 text-xs font-semibold !text-(--text-main) dark:!text-(--text-main) bg-transparent hover:!bg-(--theme-purple)/15 dark:hover:!bg-(--theme-purple)/20 transition-colors dark:bg-transparent",
                    prev: "!text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/15 dark:hover:!bg-(--theme-purple)/20 bg-transparent dark:bg-transparent",
                    next: "!text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/15 dark:hover:!bg-(--theme-purple)/20 bg-transparent dark:bg-transparent",
                    view: "!text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/15 dark:hover:!bg-(--theme-purple)/20 bg-transparent dark:bg-transparent"
                }
            }
        },
        footer: {
            base: "mt-4 flex space-x-2 border-t !border-(--border-color)/30 dark:!border-white/10 pt-3",
            button: {
                base: "w-full rounded-xl text-center text-xs font-bold px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-(--theme-purple)/20",
                today: "!bg-(--theme-purple) text-white hover:opacity-90",
                clear: "border !border-(--border-color)/40 !text-(--text-main) dark:!text-(--text-main) bg-transparent hover:!bg-(--theme-purple)/10 dark:bg-transparent"
            }
        }
    },
    views: {
        days: {
            header: {
                base: "mb-1 grid grid-cols-7",
                title: "h-6 text-center text-xs font-bold leading-6 !text-(--text-muted) dark:!text-(--text-muted)"
            },
            items: {
                base: "grid w-64 grid-cols-7",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 !text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/10 dark:hover:!bg-(--theme-purple)/20 transition-colors",
                    selected: "!bg-(--theme-purple) text-white hover:!bg-(--theme-purple)",
                    disabled: "!text-(--text-muted) opacity-30 cursor-not-allowed",
                    today: "border !border-(--theme-purple)/50 !text-(--theme-purple)"
                }
            }
        },
        months: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 !text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/10 dark:hover:!bg-(--theme-purple)/20 transition-colors",
                    selected: "!bg-(--theme-purple) text-white hover:!bg-(--theme-purple)",
                    disabled: "!text-(--text-muted) opacity-30 cursor-not-allowed"
                }
            }
        },
        years: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 !text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/10 dark:hover:!bg-(--theme-purple)/20 transition-colors",
                    selected: "!bg-(--theme-purple) text-white hover:!bg-(--theme-purple)",
                    disabled: "!text-(--text-muted) opacity-30 cursor-not-allowed"
                }
            }
        },
        decades: {
            items: {
                base: "grid w-64 grid-cols-4",
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 !text-(--text-main) dark:!text-(--text-main) hover:!bg-(--theme-purple)/10 dark:hover:!bg-(--theme-purple)/20 transition-colors",
                    selected: "!bg-(--theme-purple) text-white hover:!bg-(--theme-purple)",
                    disabled: "!text-(--text-muted) opacity-30 cursor-not-allowed"
                }
            }
        }
    }
};

type AdminDatepickerProps = Omit<React.ComponentProps<typeof Datepicker>, 'theme'>;

const toDateInputValue = (date?: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const AdminDatepicker = React.forwardRef<React.ElementRef<typeof Datepicker>, AdminDatepickerProps>(({
    language = "nl",
    labelTodayButton = "Vandaag",
    labelClearButton = "Wissen",
    weekStart = 1,
    onClick,
    defaultValue: _defaultValue,
    className = '',
    id,
    disabled,
    minDate,
    maxDate,
    value,
    onChange,
    ...props
}, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    // On touch/pointer screens, close desktop datepicker if clicking outside
    React.useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                const activeInput = containerRef.current.querySelector('input');
                if (activeInput && document.activeElement === activeInput) {
                    activeInput.blur();
                }
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    const handleMobileDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) {
            onChange?.(null);
            return;
        }
        const [y, m, d] = val.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            onChange?.(new Date(y, m - 1, d));
        }
    };

    const mobileValueStr = toDateInputValue(value);
    const minDateStr = toDateInputValue(minDate);
    const maxDateStr = toDateInputValue(maxDate);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Mobile native datepicker: fully responsive, zero popup clipping, native touch sheet */}
            <div className="block sm:hidden w-full">
                <input
                    type="date"
                    id={id}
                    value={mobileValueStr}
                    min={minDateStr || undefined}
                    max={maxDateStr || undefined}
                    disabled={disabled}
                    onChange={handleMobileDateChange}
                    className={`beheer-input w-full font-medium cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed bg-neutral-500/10' : ''}`}
                />
            </div>

            {/* Desktop Flowbite datepicker */}
            <div className="hidden sm:block w-full">
                <Datepicker
                    key={value ? value.toISOString() : 'empty'}
                    theme={customDatepickerTheme}
                    language={language}
                    labelTodayButton={labelTodayButton}
                    labelClearButton={labelClearButton}
                    weekStart={weekStart}
                    ref={ref}
                    id={id ? `${id}-desktop` : undefined}
                    onClick={onClick}
                    icon={undefined}
                    label={props.label || ""}
                    placeholder="dd-mm-jjjj"
                    disabled={disabled}
                    minDate={minDate}
                    maxDate={maxDate}
                    value={value ?? null}
                    onChange={onChange}
                    {...props}
                />
            </div>
        </div>
    );
});

AdminDatepicker.displayName = 'AdminDatepicker';
