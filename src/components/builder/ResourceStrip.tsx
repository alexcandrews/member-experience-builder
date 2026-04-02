import { useState } from 'react';
import type { Resource, ResourceType } from '../../types';
import '../../styles/resources.css';

const TYPE_ICONS: Record<ResourceType, string> = {
  pdf: '📄',
  video: '▶',
  podcast: '🎧',
};

const TYPE_LABELS: Record<ResourceType, string> = {
  pdf: 'PDF',
  video: 'Video',
  podcast: 'Podcast',
};

interface ResourceCardProps {
  resource: Resource;
  onUpdate: (updated: Resource) => void;
  onDelete: () => void;
}

function ResourceCard({ resource, onUpdate, onDelete }: ResourceCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div className="resource-card">
      <button
        className="resource-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Remove resource"
      >
        ×
      </button>

      <div className={`resource-thumbnail-placeholder ${resource.resourceType}`}>
        {TYPE_ICONS[resource.resourceType]}
      </div>

      <div className="resource-card-body">
        {editingTitle ? (
          <input
            className="resource-title-input"
            autoFocus
            value={resource.title}
            onChange={(e) => onUpdate({ ...resource, title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
          />
        ) : (
          <div className="resource-title-display" onClick={() => setEditingTitle(true)}>
            {resource.title || 'Untitled resource'}
          </div>
        )}

        <div className="resource-type-badge">
          <select
            value={resource.resourceType}
            onChange={(e) => onUpdate({ ...resource, resourceType: e.target.value as ResourceType })}
            style={{
              fontSize: 10,
              border: 'none',
              background: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pdf">📄 PDF</option>
            <option value="video">▶ Video</option>
            <option value="podcast">🎧 Podcast</option>
          </select>
        </div>
      </div>
    </div>
  );
}

interface ResourceStripProps {
  resources: Resource[];
  onUpdate: (resources: Resource[]) => void;
}

export default function ResourceStrip({ resources, onUpdate }: ResourceStripProps) {
  const handleUpdateResource = (index: number, updated: Resource) => {
    const next = [...resources];
    next[index] = updated;
    onUpdate(next);
  };

  const handleDeleteResource = (index: number) => {
    onUpdate(resources.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onUpdate([
      ...resources,
      {
        id: crypto.randomUUID(),
        title: 'New Resource',
        resourceType: 'pdf',
      },
    ]);
  };

  return (
    <div className="resource-strip-section">
      <div className="resource-strip-header">
        <h3 className="section-heading" style={{ margin: 0, borderBottom: 'none' }}>
          Resources and Downloads
        </h3>
        <span className="resource-count">{resources.length} items</span>
      </div>
      <div className="resource-strip">
        {resources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onUpdate={(updated) => handleUpdateResource(index, updated)}
            onDelete={() => handleDeleteResource(index)}
          />
        ))}
        <button className="resource-card-add" onClick={handleAdd} title="Add resource">
          +<span>Add</span>
        </button>
      </div>
    </div>
  );
}
