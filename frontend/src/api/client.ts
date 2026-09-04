const API_BASE_URL = 'http://localhost:8000/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const apiClient = {
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to upload image');
    }

    return response.json();
  },

  async executeQuery(imageId: string, query: string) {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image_id: imageId, query: query })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to execute query');
    }

    return response.json();
  },

  async submitQuery(imageId: string, query: string) {
    return this.executeQuery(imageId, query);
  },

  async generateCaption(imageId: string) {
    const response = await fetch(`${API_BASE_URL}/caption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_id: imageId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate caption');
    }

    return response.json();
  },

  async compareImages(imageId1: string, imageId2: string, timelineIds?: string[]) {
    const response = await fetch(`${API_BASE_URL}/analyze/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id_1: imageId1,
        image_id_2: imageId2,
        timeline_image_ids: timelineIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to compare images');
    }

    return response.json();
  },

  async analyzeChange(imageId1: string, imageId2: string, timelineIds?: string[]) {
    return this.compareImages(imageId1, imageId2, timelineIds);
  },

  async fuseImages(imageId1: string, imageId2: string) {
    const response = await fetch(`${API_BASE_URL}/fuse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_id_1: imageId1, image_id_2: imageId2 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fuse images');
    }

    return response.json();
  },

  async getAuditLogs() {
    const response = await fetch(`${API_BASE_URL}/audit`);
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return response.json();
  },

  async sendChatMessage(message: string, history: ChatMessage[] = [], imageId?: string | null) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        image_id: imageId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to send chat message');
    }

    return response.json();
  },

  async analyzeRegion(imageId: string, roiGeometry: any, question?: string, task?: string) {
    const response = await fetch(`${API_BASE_URL}/analyze/region`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id: imageId,
        roi_geometry: roiGeometry,
        question: question || 'Analyze this region',
        task: task || 'vqa',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to analyze region');
    }

    return response.json();
  },

  async analyzeEscalate(imageId: string, question: string, sarImageId?: string | null) {
    const response = await fetch(`${API_BASE_URL}/analyze/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id: imageId,
        question,
        sar_image_id: sarImageId || null,
        force_high_precision: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Escalation pipeline failed');
    }

    return response.json();
  },

  async getTeeShowcases() {
    const response = await fetch(`${API_BASE_URL}/tee/showcases`);
    if (!response.ok) {
      throw new Error('Failed to fetch globe showcase locations');
    }
    return response.json();
  },

  async extractTeeImagery(bbox: number[], date: string, locationId?: string) {
    const response = await fetch(`${API_BASE_URL}/tee/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bbox,
        date,
        location_id: locationId,
        source: 'NASA_GIBS',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Imagery extraction failed');
    }

    return response.json();
  },

  async geocodeLocation(query: string) {
    const response = await fetch(`${API_BASE_URL}/tee/geocode?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    return response.json();
  },

  async searchCatalog(params: {
    bbox: number[];
    startDate: string;
    endDate: string;
    sensor?: string;
    cloudMax?: number;
    limit?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/tee/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bbox: params.bbox,
        start_date: params.startDate,
        end_date: params.endDate,
        sensor: params.sensor || 'ALL',
        cloud_max: params.cloudMax ?? 30.0,
        limit: params.limit || 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Catalog search failed');
    }

    return response.json();
  },

  async validatePair(imageId1: string, imageId2: string, task?: string) {
    const response = await fetch(`${API_BASE_URL}/validate/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id_1: imageId1,
        image_id_2: imageId2,
        task: task || 'change_detection',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Pair validation failed');
    }

    return response.json();
  }
};



