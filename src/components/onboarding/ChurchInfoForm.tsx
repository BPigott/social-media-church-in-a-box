import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ArrowClockwise } from "phosphor-react";
import type { Church } from "@/types/database";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_OPTIONS = Array.from({ length: 53 }, (_, i) => {
  const hour = Math.floor(i / 4) + 8; // Start at 8 AM
  const minute = (i % 4) * 15;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
});

interface ChurchInfoFormProps {
  onSubmit: (data: Partial<Church>) => void;
  initialData?: Partial<Church>;
  buttonText?: string;
  showWebsiteRefresh?: boolean;
  isRecrawling?: boolean;
  onWebsiteRefresh?: () => void;
  websiteLastCrawled?: string | null;
}

export const ChurchInfoForm = ({ 
  onSubmit, 
  initialData, 
  buttonText = "Continue",
  showWebsiteRefresh = false,
  isRecrawling = false,
  onWebsiteRefresh,
  websiteLastCrawled
}: ChurchInfoFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    website_url: initialData?.website_url || "",
    location: initialData?.location || "",
    denomination: initialData?.denomination || "",
    vision_statement: initialData?.vision_statement || "",
    contact_email: initialData?.contact_email || "",
    service_times: initialData?.service_times || [{ day: "", time: "" }],
    social_handles: initialData?.social_handles || { facebook: "", instagram: "", twitter: "", tiktok: "" },
  });

  // Sync form state when initialData changes (e.g., when church data loads asynchronously)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        website_url: initialData.website_url || "",
        location: initialData.location || "",
        denomination: initialData.denomination || "",
        vision_statement: initialData.vision_statement || "",
        contact_email: initialData.contact_email || "",
        service_times: initialData.service_times && initialData.service_times.length > 0 
          ? initialData.service_times 
          : [{ day: "", time: "" }],
        social_handles: initialData.social_handles || { facebook: "", instagram: "", twitter: "", tiktok: "" },
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty service times
    const cleanedData = {
      ...formData,
      service_times: formData.service_times.filter(st => st.day && st.time),
    };
    
    onSubmit(cleanedData);
  };

  const addServiceTime = () => {
    setFormData({
      ...formData,
      service_times: [...formData.service_times, { day: "", time: "" }],
    });
  };

  const removeServiceTime = (index: number) => {
    setFormData({
      ...formData,
      service_times: formData.service_times.filter((_, i) => i !== index),
    });
  };

  const updateServiceTime = (index: number, field: string, value: string) => {
    const updated = [...formData.service_times];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, service_times: updated });
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Church Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Church Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          placeholder="City, County/Region"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="denomination">Denomination <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="denomination"
          placeholder="e.g. Vineyard, Baptist, Anglican, Non-denominational"
          value={formData.denomination}
          onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <div className="flex gap-2 items-start">
          <Input
            id="website_url"
            type="url"
            placeholder="https://www.yourchurch.com"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="flex-1"
          />
          {showWebsiteRefresh && formData.website_url && (
            <Button
              type="button"
              onClick={onWebsiteRefresh}
              variant="outline"
              disabled={isRecrawling}
              className="whitespace-nowrap"
            >
              <ArrowClockwise size={16} className={`mr-2 ${isRecrawling ? 'animate-spin' : ''}`} />
              {isRecrawling ? "Updating..." : "Refresh"}
            </Button>
          )}
        </div>
        {showWebsiteRefresh && formData.website_url && (
          <p className="text-xs text-muted-foreground">
            Updated your website recently? Click refresh to update our information for the style guide.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact Email *</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vision_statement">Vision Statement *</Label>
        <Textarea
          id="vision_statement"
          rows={4}
          placeholder="Describe your church's mission and vision..."
          value={formData.vision_statement}
          onChange={(e) => setFormData({ ...formData, vision_statement: e.target.value })}
          required
        />
      </div>

      {/* Service Times */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Service Times</Label>
          <Button type="button" onClick={addServiceTime} size="sm" variant="outline">
            <Plus size={16} className="mr-1" />
            Add Time
          </Button>
        </div>
        {formData.service_times.map((st, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Select value={st.day} onValueChange={(value) => updateServiceTime(index, 'day', value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={st.time} onValueChange={(value) => updateServiceTime(index, 'time', value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              type="button"
              onClick={() => removeServiceTime(index)}
              size="icon"
              variant="ghost"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>

      {/* Social Media Handles */}
      <div className="space-y-3">
        <Label>Social Media Handles</Label>
        <div className="grid md:grid-cols-2 gap-3">
          <Input
            placeholder="Facebook (username or URL)"
            value={formData.social_handles.facebook || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                social_handles: { ...formData.social_handles, facebook: e.target.value },
              })
            }
          />
          <Input
            placeholder="Instagram (@username)"
            value={formData.social_handles.instagram || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                social_handles: { ...formData.social_handles, instagram: e.target.value },
              })
            }
          />
          <Input
            placeholder="Twitter/X (@username)"
            value={formData.social_handles.twitter || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                social_handles: { ...formData.social_handles, twitter: e.target.value },
              })
            }
          />
          <Input
            placeholder="TikTok (@username)"
            value={formData.social_handles.tiktok || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                social_handles: { ...formData.social_handles, tiktok: e.target.value },
              })
            }
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        {buttonText}
      </Button>
    </form>
  );
};
