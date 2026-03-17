import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SermonSeries } from "@/types/database";

interface SeriesSelectorProps {
  churchId: string;
  seriesList: SermonSeries[];
  selectedSeriesId: string | null;
  seriesWeekNumber: number | null;
  onSeriesChange: (seriesId: string | null) => void;
  onWeekNumberChange: (week: number | null) => void;
  onSeriesCreated: (series: SermonSeries) => void;
}

export function SeriesSelector({
  churchId,
  seriesList,
  selectedSeriesId,
  seriesWeekNumber,
  onSeriesChange,
  onWeekNumberChange,
  onSeriesCreated,
}: SeriesSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [newSeriesDescription, setNewSeriesDescription] = useState("");
  const [newSeriesTotalWeeks, setNewSeriesTotalWeeks] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const selectedSeries = seriesList.find((s) => s.id === selectedSeriesId);

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("sermon_series")
        .insert({
          church_id: churchId,
          name: newSeriesName.trim(),
          description: newSeriesDescription.trim() || null,
          total_weeks: newSeriesTotalWeeks ? parseInt(newSeriesTotalWeeks) : null,
        })
        .select()
        .single();

      if (error) throw error;

      const newSeries: SermonSeries = {
        id: data.id,
        church_id: data.church_id,
        name: data.name,
        description: data.description,
        total_weeks: data.total_weeks,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      onSeriesCreated(newSeries);
      onSeriesChange(newSeries.id);
      setShowCreateForm(false);
      setNewSeriesName("");
      setNewSeriesDescription("");
      setNewSeriesTotalWeeks("");
      toast({ title: "Series created", description: `"${newSeries.name}" is ready to use.` });
    } catch (err: any) {
      toast({ title: "Error creating series", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="series-select">Sermon Series (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Link this content to a sermon series for continuity across weeks
        </p>
      </div>

      <select
        id="series-select"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={selectedSeriesId || ""}
        onChange={(e) => onSeriesChange(e.target.value || null)}
      >
        <option value="">No series selected</option>
        {seriesList.map((series) => (
          <option key={series.id} value={series.id}>
            {series.name}{series.total_weeks ? ` (${series.total_weeks} weeks)` : ""}
          </option>
        ))}
      </select>

      {selectedSeriesId && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label htmlFor="week-number">Week Number</Label>
            <Input
              id="week-number"
              type="number"
              min={1}
              max={selectedSeries?.total_weeks || 52}
              placeholder={`Week number${selectedSeries?.total_weeks ? ` (1-${selectedSeries.total_weeks})` : ""}`}
              value={seriesWeekNumber || ""}
              onChange={(e) => onWeekNumberChange(e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          {selectedSeries?.total_weeks && (
            <p className="text-xs text-muted-foreground mt-5">
              of {selectedSeries.total_weeks} weeks
            </p>
          )}
        </div>
      )}

      {!showCreateForm ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(true)}
        >
          + New Series
        </Button>
      ) : (
        <div className="border rounded-md p-3 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Create New Series</p>
          <div>
            <Label htmlFor="new-series-name">Series Name *</Label>
            <Input
              id="new-series-name"
              placeholder="e.g., The Gospel of John, Faith Foundations"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-series-description">Description (Optional)</Label>
            <Textarea
              id="new-series-description"
              placeholder="Brief description of the series theme or focus"
              value={newSeriesDescription}
              onChange={(e) => setNewSeriesDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="new-series-weeks">Total Weeks (Optional)</Label>
            <Input
              id="new-series-weeks"
              type="number"
              min={1}
              placeholder="e.g., 6, 12"
              value={newSeriesTotalWeeks}
              onChange={(e) => setNewSeriesTotalWeeks(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateSeries}
              disabled={!newSeriesName.trim() || creating}
            >
              {creating ? "Creating..." : "Create Series"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setNewSeriesName("");
                setNewSeriesDescription("");
                setNewSeriesTotalWeeks("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
