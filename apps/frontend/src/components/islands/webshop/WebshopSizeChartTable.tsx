import { type WebshopSizeChart } from '@salvemundi/validations/schema/webshop.zod';

interface WebshopSizeChartTableProps {
    sizeChart: WebshopSizeChart;
}

export default function WebshopSizeChartTable({ sizeChart }: WebshopSizeChartTableProps) {
    if (sizeChart.rows.length === 0) return null;

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-(--theme-purple)/60">Maattabel</h3>
            <div className="overflow-x-auto rounded-2xl border border-(--border-color)">
                <table className="w-full min-w-[28rem] text-sm">
                    <thead>
                        <tr className="bg-(--bg-soft)">
                            <th scope="col" className="px-4 py-2 text-left font-bold text-(--theme-purple)/80 whitespace-nowrap">Maat</th>
                            {sizeChart.headers.map((header, idx) => (
                                <th key={idx} scope="col" className="px-4 py-2 text-left font-bold text-(--theme-purple)/80 whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sizeChart.rows.map((row, idx) => (
                            <tr key={idx} className="border-t border-(--border-color)">
                                <th scope="row" className="px-4 py-2 text-left font-bold text-(--text-muted) whitespace-nowrap">{row.size}</th>
                                {row.values.map((value, valueIdx) => (
                                    <td key={valueIdx} className="px-4 py-2 text-(--text-muted) whitespace-nowrap">{value}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
