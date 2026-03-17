export default function CategoryButton({ label, active, onClick, }: {
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button onClick={onClick} className={`px-4 py-1 rounded-full text-sm font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-300 ${active ? "bg-primary text-white shadow-md scale-105" : "bg-card text-muted-foreground border border-border hover:bg-muted"}`} >
            {label}
        </button>
    )
}