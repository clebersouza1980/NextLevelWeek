import {Request,Response} from 'express';
import db from '../database/conexao';
import convertHourInMinutes from '../utils/convertHourToMinutes';


interface ScheduleItem{
    week_day:integer;
    from :string;
    to:string;
}


export default class ClassesController{

    async index (request:Request,response:Response) {
        const filters = request.query;

        if(!filters.week_day || !filters.subject || !filters.time){
            return response.status(400).json({
                error:'Missing filters to search classes'
            });
        }

        const timeInMinutes = convertHourInMinutes(filters.time as string);

        const classes = await db('classes')
        .whereExists(function(){
            this.select('class_schedule.*')
            .from('class_schedule')
            .whereRaw('`class_schedule`.`class_id` = `classes`.`id` ')
            .whereRaw('`class_schedule`.`week_day` = ??',[Number(filters.week_day)])
            .whereRaw('`class_schedule`.`from` <= ??',[Number(timeInMinutes)])
            .whereRaw('`class_schedule`.`to` > ??',[Number(timeInMinutes)])
        })
        .where('classes.subject','=',filters.subject as string)
        .join('users','classes.user_id','=','user_id')
        .select(['classes.*','users.*']);

        return response.json(classes);
    }


    async create (request:Request,response:Response) {
    const {
        name,
        avatar,
        whatsapp,
        bio,
        subject,
        cost,
        schedule
     }= request.body;

    console.log(request.body);

    try{
        const trx = await db.transaction();

        const insertedUsersId = await trx('users').insert({
            name,
            avatar,
            whatsapp,
            bio,
        });

        const user_id = insertedUsersId[0];

        const insertedClassesId = await trx('classes').insert({
            subject,
            cost,
            user_id,
        });
        
        const class_id = insertedClassesId[0];

        const classSchedule = schedule.map((scheduleItem:ScheduleItem) =>{
            return{
                class_id,
                week_day: scheduleItem.week_day,
                from: convertHourInMinutes(scheduleItem.from), 
                to: convertHourInMinutes(scheduleItem.to),
            };
        })

        await trx('class_schedule').insert(classSchedule);
        await trx.commit();
        
        return response.status(201).send();
    
    }catch(err){
        trx.rollback();
        return response.status(400).json({
            error:'Unexpected error while creating an new class.'
        });
    }
}}
