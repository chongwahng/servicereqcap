namespace cng.servicereq;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity Incidents : cuid, managed {
    ticket_no   : String(8);
    description : String;
    status      : String(10);
}
