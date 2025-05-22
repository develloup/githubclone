import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusDialogProps {
  open: boolean;
  onClose: () => void;
}

const StatusDialog = ({ open, onClose }: StatusDialogProps) => {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [clearStatus, setClearStatus] = useState("never");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Eingabefeld */}
          <Input placeholder="Enter your status..." value={status} onChange={(e) => setStatus(e.target.value)} />

          {/* Checkbox: Busy */}
          <div className="flex items-center space-x-2">
            <Checkbox checked={busy} onCheckedChange={(checked) => setBusy(checked === true)} />
            <label>Busy</label>
          </div>

          {/* Select-Box: Clear Status */}
          <label>Clear Status</label>
          <Select value={clearStatus} onValueChange={setClearStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="30">In 30 minutes</SelectItem>
              <SelectItem value="60">In 1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={() => setClearStatus("never")}>Clear Status</Button>
          <Button onClick={onClose}>Set Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusDialog;
