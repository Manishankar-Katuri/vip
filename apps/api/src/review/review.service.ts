import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService
  ) {}

  /*
   REVIEW ANALYSIS
  */

  analyzeReview(review: string) {

    const text = review.toLowerCase();

    const issues: string[] = [];

    // Billing

    if (
      text.includes("fee") ||
      text.includes("money") ||
      text.includes("charged") ||
      text.includes("cost")
    ) {
      issues.push("BILLING");
    }

    // Cleanliness

    if (
      text.includes("dirty") ||
      text.includes("clean") ||
      text.includes("hygiene")
    ) {
      issues.push("CLEANLINESS");
    }

    // Staff

    if (
      text.includes("staff") ||
      text.includes("reception") ||
      text.includes("attendant") ||
      text.includes("rude")
    ) {
      issues.push("STAFF_BEHAVIOR");
    }

    // Doctor trust

    if (
      text.includes("doctor") ||
      text.includes("diagnosis") ||
      text.includes("consultation") ||
      text.includes("treatment")
    ) {
      issues.push("DOCTOR_TRUST");
    }

    // Wait

    if (
      text.includes("wait") ||
      text.includes("delay")
    ) {
      issues.push("WAIT_TIME");
    }

    // Equipment

    if (
      text.includes("equipment") ||
      text.includes("machine") ||
      text.includes("old")
    ) {
      issues.push("EQUIPMENT");
    }

    const severity =
      issues.length >= 4
        ? "CRITICAL"
        : issues.length >= 2
        ? "HIGH"
        : issues.length >= 1
        ? "MEDIUM"
        : "LOW";

    return {
      issues,
      severity
    };
  }

  /*
   AI REPLY
  */

  generateReply(
    issues: string[]
  ): string {

    if (
      issues.includes("DOCTOR_TRUST")
    ) {

      return "We're sorry your experience did not meet expectations. Patient care and trust are important to us.";

    }

    if (
      issues.includes("STAFF_BEHAVIOR")
    ) {

      return "We apologize for your experience and have shared your feedback internally.";

    }

    if (
      issues.includes("CLEANLINESS")
    ) {

      return "We appreciate your feedback and are reviewing cleanliness standards internally.";

    }

    return "We appreciate your feedback and are reviewing your concerns.";
  }

  /*
   IMPORT REVIEWS
  */

  async ingestReviews(
    workspaceId: string,
    reviews: any[]
  ) {

    for (const review of reviews) {

      const analysis =
        this.analyzeReview(
          review.text || ""
        );

      await this.prisma.review.create({

        data: {

          workspaceId,

          author:
            review.author || "Unknown",

          rating:
            review.rating || 0,

          content:
            review.text || "",

          source:
            "GOOGLE",

          sentiment:

            review.rating <= 2
              ? "NEGATIVE"
              : review.rating === 3
              ? "NEUTRAL"
              : "POSITIVE",

          category:

            analysis.issues.join(", "),

          issueDetected:

            analysis.issues.length > 0,

          aiReply:

            this.generateReply(
              analysis.issues
            ),

          status:
            "PENDING"

        }

      });

    }

    return {

      message:
        `${reviews.length} reviews imported`

    };

  }

  /*
   OLD CONTROLLER COMPATIBILITY
  */

  async create(
    workspaceId: string,
    body: any
  ) {

    return this.ingestReviews(
      workspaceId,
      [body]
    );

  }

  async findAll(
    workspaceId: string
  ) {

    return this.prisma.review.findMany({

      where: {
        workspaceId
      },

      orderBy: {
        createdAt: "desc"
      }

    });

  }

  async getReviews(
    workspaceId: string
  ) {

    return this.findAll(
      workspaceId
    );

  }

  async findAlerts(
    workspaceId: string
  ) {

    return this.prisma.reviewAlert.findMany({

      where: {
        workspaceId
      },

      orderBy: {
        createdAt: "desc"
      }

    });

  }

  async findAlertDetails(
    workspaceId: string,
    alertId: string
  ) {

    const alert =

      await this.prisma.reviewAlert.findUnique({

        where: {
          id: alertId
        }

      });

    const reviews =

      await this.prisma.review.findMany({

        where: {
          workspaceId
        }

      });

    return {

      alert,
      reviews

    };

  }

  async resolveAlert(
    alertId: string
  ) {

    return this.prisma.reviewAlert.update({

      where: {
        id: alertId
      },

      data: {
        status: "RESOLVED"
      }

    });

  }

  async dashboard(
workspaceId:string
){

const reviews=

await this.prisma.review.findMany({

where:{
workspaceId
}

});

const alerts=

await this.prisma.reviewAlert.count({

where:{

workspaceId,

status:"OPEN"

}

});

const negative=

reviews.filter(
r=>

r.sentiment==="NEGATIVE"
);

const trustIssues=

reviews.filter(
r=>

r.category?.includes(
"DOCTOR_TRUST"
)
).length;

const staffIssues=

reviews.filter(
r=>

r.category?.includes(
"STAFF_BEHAVIOR"
)
).length;

const score=

Math.max(

100-

(negative.length*8)-

(trustIssues*6)-

(staffIssues*5)-

(alerts*10),

20

);

let summary=

"Healthy reputation";

if(
score<80
){

summary=

"Patient experience concerns detected"

}

if(
score<60
){

summary=

"Critical reputation risk detected"

}

return{

totalReviews:
reviews.length,

negativeReviews:
negative.length,

doctorTrustIssues:
trustIssues,

staffIssues,

openAlerts:
alerts,

healthScore:
score,

summary

};

}

}