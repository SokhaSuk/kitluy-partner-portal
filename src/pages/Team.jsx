import { useState } from 'react';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';
import { Avatar, Badge, Button, Card, PageHeader, Tab, TextInput } from '../components/ui/index.jsx';

const PLUS = ['M12 5v14', 'M5 12h14'];
const TEAM_TABS = ['Members', 'Shifts', 'Attendance', 'Permissions'];
const roleTone = { Owner: 'purple', Manager: 'info', Cashier: 'neutral', Staff: 'gold' };
const shiftTone = { 'On shift': 'ok', Upcoming: 'neutral', Done: 'neutral' };
const permissionColumns = ['Owner', 'Manager', 'Cashier', 'Staff', 'Readonly'];
const HCELL = 'text-[11.5px] font-semibold tracking-[0.03em] text-muted uppercase';
const SHIFT_COLS = '1.4fr .9fr 1.1fr 1fr .8fr';
const ATT_COLS = '1.4fr .9fr .7fr .7fr 1fr .9fr';
const PERM_COLS = '1.7fr repeat(5,1fr)';

function PermissionMark({ mark }) {
  if (mark === 'yes') return <span className="text-[14px] font-bold text-ok-fg">✓</span>;
  if (mark === 'ltd') return <span className="rounded-full bg-warn-bg px-2 py-0.5 text-[11px] font-semibold text-warn-fg">Limited</span>;
  return <span className="text-[13px] text-faint">—</span>;
}

function minutesFromHours(value) {
  const text = String(value || '');
  const hours = Number(text.match(/(\d+)h/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)m/)?.[1] || 0);
  return hours * 60 + minutes;
}

export default function Team({ forcedTab = null }) {
  const p = usePortal();
  const activeTab = forcedTab || p.teamTab;
  const { members, shifts, attendance, permissions, recordGenericAction } = useDomain();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleNote, setScheduleNote] = useState('');
  const attendanceMinutes = (attendance || []).reduce(
    (sum, row) => sum + minutesFromHours(row.hours),
    0
  );
  const lateArrivals = (attendance || []).filter((row) => String(row.status).startsWith('Late')).length;
  const hoursSummary = `${Math.floor(attendanceMinutes / 60)}h ${attendanceMinutes % 60}m`;

  const saveScheduleNote = () => {
    const note = scheduleNote.trim();
    if (!note) {
      p.notify('Enter a schedule note first');
      return;
    }
    recordGenericAction('team:schedule-note', `Schedule note: ${note}`);
    setScheduleNote('');
    setScheduleOpen(false);
    p.notify('Schedule note recorded locally');
  };

  return (
    <div className="animate-kfade">
      <PageHeader title="Team & Shifts" subtitle="Canonical members, shifts, attendance and permissions">
        <Button variant="primary" icon={PLUS} onClick={p.openDrawer('newmember')}>Add member</Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-1">
        {TEAM_TABS.map((tab) => <Tab key={tab} active={activeTab === tab} onClick={() => p.set({ empTab: 'Employees', teamTab: tab })}>{tab}</Tab>)}
      </div>

      {activeTab === 'Members' && (
        <Card className="overflow-hidden">
          {(members || []).map((member) => (
            <button key={member.id || member.name} type="button" onClick={p.openDrawer('member', member.id || member.name)} className="flex w-full items-center gap-3.5 border-b border-border px-4.5 py-3.5 text-left hover:bg-hover">
              <Avatar name={member.name} />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold text-text">{member.name}</div><div className="text-[12px] text-faint">{member.contact} · {member.pin}</div></div>
              <span className="text-[12px] text-muted">{member.active}</span>
              <Badge tone={roleTone[member.role] || 'neutral'}>{member.role}</Badge>
            </button>
          ))}
        </Card>
      )}

      {activeTab === 'Shifts' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4.5 py-3.25">
            <span className="text-[13px] text-muted">{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} · canonical schedule</span>
            <Button onClick={() => setScheduleOpen((open) => !open)}>{scheduleOpen ? 'Close note' : 'Add schedule note'}</Button>
          </div>
          {scheduleOpen && (
            <div className="flex items-center gap-2.5 border-b border-border bg-panel-2 px-4.5 py-3">
              <TextInput value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} placeholder="Record a schedule change or follow-up…" className="flex-1" />
              <Button variant="primary" onClick={saveScheduleNote}>Record note</Button>
            </div>
          )}
          <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: SHIFT_COLS }}>
            {['Staff', 'Role', 'Shift', 'Station', 'Status'].map((label) => <span key={label} className={HCELL}>{label}</span>)}
          </div>
          {(shifts || []).map((shift) => (
            <div key={shift.id || `${shift.name}-${shift.time}`} className="grid items-center gap-3 border-b border-border px-4.5 py-3" style={{ gridTemplateColumns: SHIFT_COLS }}>
              <div className="flex min-w-0 items-center gap-2.5"><Avatar name={shift.name} className="h-7.5 w-7.5 text-[11px]" /><span className="truncate text-[13.5px] font-medium text-text">{shift.name}</span></div>
              <span className="text-[12.5px] text-muted">{shift.role}</span>
              <div><div className="text-[13px] text-text">{shift.time}</div><div className="text-[11.5px] text-faint">{shift.hours}</div></div>
              <span className="text-[12.5px] text-muted">{shift.station}</span>
              <Badge tone={shiftTone[shift.status] || 'neutral'}>{shift.status}</Badge>
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'Attendance' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4.5 py-3.25"><span className="text-[13px] text-muted">Canonical clock-in and clock-out records</span><span className="text-[12px] text-muted"><strong className="font-semibold text-text">{hoursSummary}</strong> recorded · {lateArrivals} late</span></div>
          <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: ATT_COLS }}>{['Staff', 'Date', 'In', 'Out', 'Hours', 'Status'].map((label) => <span key={label} className={HCELL}>{label}</span>)}</div>
          {(attendance || []).map((row, index) => (
            <div key={row.id || `${row.name}-${row.date}-${index}`} className="grid items-center gap-3 border-b border-border px-4.5 py-3" style={{ gridTemplateColumns: ATT_COLS }}>
              <span className="text-[13.5px] font-medium text-text">{row.name}</span><span className="text-[12.5px] text-muted">{row.date}</span><span className="font-mono text-[13px] text-text">{row.tin}</span><span className="font-mono text-[13px] text-text">{row.tout}</span><span className="text-[12.5px] text-muted">{row.hours}</span><Badge tone={String(row.status).startsWith('Late') ? 'warn' : 'ok'}>{row.status}</Badge>
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'Permissions' && (
        <Card className="overflow-hidden">
          <div className="px-4.5 pt-3.5 pb-2.5 text-[13px] text-muted">Canonical permissions by role.</div>
          <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: PERM_COLS }}><span className={HCELL}>Permission</span>{permissionColumns.map((column) => <span key={column} className={`${HCELL} text-center`}>{column}</span>)}</div>
          {(permissions || []).map((permission) => <div key={permission.id || permission.label} className="grid items-center gap-3 border-b border-border px-4.5 py-2.75" style={{ gridTemplateColumns: PERM_COLS }}><span className="text-[13px] text-text">{permission.label}</span>{permission.cells.map((cell, index) => <span key={index} className="flex justify-center"><PermissionMark mark={cell} /></span>)}</div>)}
        </Card>
      )}
    </div>
  );
}
