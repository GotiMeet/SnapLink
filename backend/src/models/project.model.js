import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Project title cannot exceed 100 characters'],
    },
    // Set when the project is soft-deleted; null while active.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Supports the dashboard listing: a user's active projects, most recently updated first.
projectSchema.index(
  { owner: 1, updatedAt: -1 },
  { partialFilterExpression: { deletedAt: null } }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
