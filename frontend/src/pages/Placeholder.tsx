import { Card } from '@/components/ui/Card';

/**
 * Temporary stand-in so the route table is complete and navigable in Phase 0.
 * Every one of these is replaced by its real screen in Phases 1-9; none should
 * survive to v1. Each names the screen code it is holding open.
 */
export function Placeholder({ code, name }: { code: string; name: string }) {
  return (
    <Card className="p-lg">
      <p className="font-mono text-mono-code text-content-tertiary">{code}</p>
      <h1 className="mt-2xs text-heading-xl">{name}</h1>
      <p className="mt-xs text-body-md text-content-secondary">
        Not implemented yet. This route is reserved by the Phase 0 foundation.
      </p>
    </Card>
  );
}
