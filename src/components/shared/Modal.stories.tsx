import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Trash2, Rocket } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalSubheader,
  ModalBody,
  ModalFooter,
} from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * The canonical modal shell. Every dialog in the app is built from these six
 * pieces — see the `Modal.tsx` header comment for the layout contract.
 */
const meta: Meta<typeof ModalContent> = {
  title: "Shared/Modal",
  component: ModalContent,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ModalContent>;

function FormDemo() {
  const [open, setOpen] = React.useState(false);
  return (
      <>
        <Button onClick={() => setOpen(true)}>Edit camera</Button>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent size="lg">
            <ModalHeader
              title="Edit Camera"
              description="Update fields for Cam-01. Camera ID cannot be changed."
            />
            <ModalBody className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Camera Name
                </label>
                <Input defaultValue="Checkpoint C1 — Entry" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  IP Address
                </label>
                <Input defaultValue="10.10.0.101" className="font-mono" />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
  );
}

/** Default form modal: header → scrolling body → right-aligned footer. */
export const Form: Story = { render: () => <FormDemo /> };

function DestructiveDemo() {
  const [open, setOpen] = React.useState(false);
  return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete rule
        </Button>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent size="sm">
            <ModalHeader
              title="Delete Rule"
              description="This action cannot be undone."
              icon={Trash2}
              tone="destructive"
            />
            <ModalBody className="text-base text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">SOP Compliance Rule</span>? Any
              models that reference this rule will need to be updated.
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setOpen(false)}>
                Delete Rule
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
  );
}

/** Destructive confirm: `tone` colours the title and the header icon. */
export const Destructive: Story = { render: () => <DestructiveDemo /> };

function SubheaderDemo() {
  const [open, setOpen] = React.useState(false);
  return (
      <>
        <Button onClick={() => setOpen(true)}>Deploy model</Button>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent size="lg">
            <ModalHeader
              title="Confirm Deployment"
              description="Creating 3 deployment records."
              icon={Rocket}
            />
            <ModalSubheader className="flex items-center gap-2">
              <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground">
                Step 2 of 3
              </span>
            </ModalSubheader>
            <ModalBody className="space-y-2 text-base text-muted-foreground">
              <p>Model, site and cameras are confirmed.</p>
              <p>Offline cameras queue as “Pending” and resume on reconnect.</p>
            </ModalBody>
            <ModalFooter align="between">
              <span className="text-sm text-muted-foreground">3 cameras selected</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Back
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Deploy
                </Button>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
  );
}

/**
 * `ModalSubheader` is the only slot allowed between header and body — used for
 * wizard steppers and sticky filter strips. `align="between"` splits the footer.
 */
export const WithSubheader: Story = { render: () => <SubheaderDemo /> };
