import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import {
  formatTimestamp,
  getCreatedAt,
  getJobDisplayName,
  getUpdatedAt,
  sortJobsByUpdatedAt,
} from '../model';
import { AhabJob, AhabJobType } from '../types';
import { RecordDetailsDialog } from './JobDialogs';

function statusColor(status: string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'warning';
    case 'STARTED':
      return 'info';
    case 'COMPLETE':
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
}

export function JobStatusChip({ status }: { status: string }) {
  return <Chip size="small" label={status} color={statusColor(status)} />;
}

interface JobsTableProps {
  jobs: AhabJob[];
  onEdit?: (job: AhabJob) => void;
  limit?: number;
}

export function JobsTable({ jobs, onEdit, limit }: JobsTableProps) {
  const [selectedJob, setSelectedJob] = React.useState<AhabJob | null>(null);
  const rows = sortJobsByUpdatedAt(jobs).slice(0, limit ?? jobs.length);
  if (rows.length === 0) {
    return <Typography color="text.secondary">No jobs found.</Typography>;
  }

  return (
    <>
      <TableContainer>
        <Table size="small" aria-label="ahab jobs">
          <TableHead>
            <TableRow>
              <TableCell>Job</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              {onEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(job => (
              <TableRow
                key={job.id}
                hover
                role="button"
                tabIndex={0}
                aria-label={`View job ${job.id}`}
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelectedJob(job)}
                onKeyDown={event => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    setSelectedJob(job);
                  }
                }}
              >
                <TableCell>
                  <Typography variant="body2">{getJobDisplayName(job)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.id}
                  </Typography>
                </TableCell>
                <TableCell>{job.job_type}</TableCell>
                <TableCell>
                  <JobStatusChip status={job.current_status} />
                </TableCell>
                <TableCell>{formatTimestamp(getCreatedAt(job))}</TableCell>
                <TableCell>{formatTimestamp(getUpdatedAt(job))}</TableCell>
                {onEdit && (
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={event => {
                        event.stopPropagation();
                        onEdit(job);
                      }}
                    >
                      Update
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <RecordDetailsDialog
        title={`Job details: ${selectedJob?.id ?? ''}`}
        record={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
}

interface JobTypesTableProps {
  jobTypes: AhabJobType[];
  onEdit: (jobType: AhabJobType) => void;
}

export function JobTypesTable({ jobTypes, onEdit }: JobTypesTableProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<AhabJobType | null>(null);
  if (jobTypes.length === 0) {
    return <Typography color="text.secondary">No job types found.</Typography>;
  }

  return (
    <>
      <TableContainer>
        <Table size="small" aria-label="ahab job types">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Pool</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>VM size</TableCell>
              <TableCell>Max nodes</TableCell>
              <TableCell>Resources</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...jobTypes]
              .sort((left, right) => left.name.localeCompare(right.name))
              .map(jobType => (
                <TableRow
                  key={jobType.id || jobType.name}
                  hover
                  role="button"
                  tabIndex={0}
                  aria-label={`View job template ${jobType.name}`}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedTemplate(jobType)}
                  onKeyDown={event => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      setSelectedTemplate(jobType);
                    }
                  }}
                >
                  <TableCell>{jobType.name}</TableCell>
                  <TableCell>{jobType.pool_name}</TableCell>
                  <TableCell sx={{ maxWidth: 320, overflowWrap: 'anywhere' }}>
                    {jobType.image}
                  </TableCell>
                  <TableCell>{jobType.vm_size}</TableCell>
                  <TableCell>{jobType.max_nodes}</TableCell>
                  <TableCell>
                    {jobType.cpu} CPU / {jobType.memory}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={event => {
                        event.stopPropagation();
                        onEdit(jobType);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <RecordDetailsDialog
        title={`Job template: ${selectedTemplate?.name ?? ''}`}
        record={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </>
  );
}
