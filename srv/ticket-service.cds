using cng.servicereq as req from '../db/data-model';

service TicketService {
    @Capabilities.InsertRestrictions.Insertable : true
    @Capabilities.UpdateRestrictions.Updatable  : true
    @Capabilities.DeleteRestrictions.Deletable  : true
    entity Incidents as projection on req.Incidents;

    action approve(id : Incidents:ID);
    action reject(id : Incidents:ID);
}
