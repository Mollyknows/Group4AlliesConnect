import { useState } from "react";
import { Modal } from "react-bootstrap";
import "../../App.css";
import { useModalRemountKey } from "../../hooks/useModalRemountKey";
import CreateEventContent from "./CreateEventContent";
import CreateResourceContent from "./CreateResourceContent";
import EditEventsContent from "./EditEventsContent";
import EditResourcesContent from "./EditResourcesContent";
import ExportHoursContent from "./ExportHoursContent";
import ProviderDetailsModal from "./ProviderDetailsModal";
import SendInviteContent from "./SendInviteContent";
import VolunteerApprovalContent from "./VolunteerApprovalContent";
import VolunteerShiftsContent from "./VolunteerShiftsContent";

const MODAL_TYPE = {
  createEvent: {
    title: "Create Event",
    Content: CreateEventContent,
  },
  editEvents: {
    title: "Edit Events",
    Content: EditEventsContent,
  },
  createResource: {
    title: "Create Resource",
    Content: CreateResourceContent,
  },
  editResources: {
    title: "Edit Resources",
    Content: EditResourcesContent,
  },
  volunteerShifts: {
    title: "Volunteer Shift Management",
    Content: VolunteerShiftsContent,
  },
  volunteerApproval: {
    title: "Volunteer Approval",
    Content: VolunteerApprovalContent,
  },
  exportHours: {
    title: "Export Volunteer Hours",
    Content: ExportHoursContent,
  },
  sendInvite: {
    title: "Send Organization Invite",
    Content: SendInviteContent,
  },
};

function ProviderModal({ show, onHide, type, providerId, userId }) {
  const [detailModalType, setDetailModalType] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const config = MODAL_TYPE[type];

  // Increment a key each time the modal opens so content components remount
  // and re-fetch fresh data
  const [openKey, bumpKey] = useModalRemountKey(show);

  const handleViewDetails = (detailType, data) => {
    setSelectedData(data);
    setDetailModalType(detailType);
  };

  const modalClass =
    type === "createEvent" || type === "createResource" || type === "sendInvite"
      ? "modal-half"
      : "modal-wide";

  return (
    <Modal show={show} className={modalClass} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{config?.title || ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {config && (
          <config.Content
            key={openKey}
            onViewDetails={handleViewDetails}
            providerId={providerId}
            userId={userId}
          />
        )}
      </Modal.Body>
      <ProviderDetailsModal
        show={!!detailModalType}
        type={detailModalType}
        data={selectedData}
        userId={userId}
        onHide={() => {
          setDetailModalType("");
          setSelectedData(null);
          bumpKey();
        }}
      />
    </Modal>
  );
}

export default ProviderModal;
