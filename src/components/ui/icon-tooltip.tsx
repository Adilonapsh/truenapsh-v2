import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

const IconTooltip = ({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) => (
    <Tooltip>
        <TooltipTrigger onClick={onClick} asChild>
            <button type="button" className="p-1 hover:opacity-80">
                {icon}
            </button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{label}</p>
        </TooltipContent>
    </Tooltip>
);

export default IconTooltip;
